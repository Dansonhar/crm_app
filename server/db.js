// SQLite persistence for the AgencyFlow CRM.
//
// Uses Node's built-in `node:sqlite` (Node 22+, run with the --experimental-sqlite
// flag — see the `server` script in package.json). The database lives in a single
// file next to this module (server/data.sqlite) and is git-ignored.
//
// Each CRM entity gets its own real table. Scalar fields are stored as typed
// columns so the database is directly queryable/inspectable; nested arrays
// (tags, team, deliverables, line items) are stored as JSON text columns.

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data.sqlite');

// Schema descriptor: column name -> SQL type. Columns listed in `json` are
// serialized to/from JSON text automatically. The first column is the primary key.
const TABLES = {
  clients: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      name: 'TEXT',
      company: 'TEXT',
      email: 'TEXT',
      phone: 'TEXT',
      status: 'TEXT',
      industry: 'TEXT',
      website: 'TEXT',
      address: 'TEXT',
      lastContacted: 'TEXT',
      createdAt: 'TEXT',
      avatarColor: 'TEXT',
      tags: 'TEXT',
      telegramChatId: 'TEXT',
      telegramUsername: 'TEXT',
    },
    json: ['tags'],
  },
  leads: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      clientName: 'TEXT',
      company: 'TEXT',
      dealValue: 'REAL',
      source: 'TEXT',
      priority: 'TEXT',
      nextFollowUp: 'TEXT',
      stage: 'TEXT',
      avatarColor: 'TEXT',
    },
    json: [],
  },
  projects: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      name: 'TEXT',
      clientId: 'TEXT',
      clientName: 'TEXT',
      deadline: 'TEXT',
      progress: 'REAL',
      status: 'TEXT',
      team: 'TEXT',
      deliverables: 'TEXT',
      budget: 'REAL',
    },
    json: ['team', 'deliverables'],
  },
  invoices: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      number: 'TEXT',
      clientId: 'TEXT',
      clientName: 'TEXT',
      amount: 'REAL',
      issueDate: 'TEXT',
      dueDate: 'TEXT',
      status: 'TEXT',
      items: 'TEXT',
    },
    json: ['items'],
  },
  tasks: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      title: 'TEXT',
      priority: 'TEXT',
      dueDate: 'TEXT',
      clientId: 'TEXT',
      clientName: 'TEXT',
      status: 'TEXT',
      category: 'TEXT',
    },
    json: [],
  },
  activities: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      type: 'TEXT',
      description: 'TEXT',
      timestamp: 'TEXT',
      clientId: 'TEXT',
      clientName: 'TEXT',
    },
    json: [],
  },
  // Client notes are keyed by client in the UI (Record<clientId, ClientNote[]>),
  // but stored flat here with a clientId column and reassembled on read.
  notes: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      clientId: 'TEXT',
      author: 'TEXT',
      content: 'TEXT',
      createdAt: 'TEXT',
    },
    json: [],
  },
};

export const ENTITIES = Object.keys(TABLES);

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');

for (const [table, { columns }] of Object.entries(TABLES)) {
  const cols = Object.entries(columns)
    .map(([name, type]) => `"${name}" ${type}`)
    .join(', ');
  db.exec(`CREATE TABLE IF NOT EXISTS "${table}" (${cols});`);
}

function serializeRow(table, row) {
  const { columns, json } = TABLES[table];
  const values = {};
  for (const name of Object.keys(columns)) {
    let value = row[name];
    if (value === undefined) value = null;
    if (json.includes(name)) {
      value = JSON.stringify(value ?? []);
    }
    values[name] = value;
  }
  return values;
}

function deserializeRow(table, row) {
  const { json } = TABLES[table];
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null) continue; // drop empty optional fields
    out[key] = json.includes(key) ? JSON.parse(value) : value;
  }
  // Ensure JSON columns always exist as arrays even if stored null.
  for (const key of json) {
    if (out[key] === undefined) out[key] = [];
  }
  return out;
}

export function getEntity(table) {
  const rows = db.prepare(`SELECT * FROM "${table}"`).all();
  return rows.map((r) => deserializeRow(table, r));
}

// Replace the full contents of one table with the provided rows (in a transaction).
export function replaceEntity(table, rows) {
  const { columns } = TABLES[table];
  const names = Object.keys(columns);
  const placeholders = names.map((n) => `@${n}`).join(', ');
  const insert = db.prepare(
    `INSERT INTO "${table}" (${names.map((n) => `"${n}"`).join(', ')}) VALUES (${placeholders})`,
  );
  db.exec('BEGIN');
  try {
    db.exec(`DELETE FROM "${table}"`);
    for (const row of rows) {
      insert.run(serializeRow(table, row));
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Assemble the full CRM state. `notes` is reshaped into Record<clientId, ClientNote[]>.
export function getAllData() {
  const data = {};
  for (const table of ENTITIES) {
    if (table === 'notes') continue;
    data[table] = getEntity(table);
  }
  const notes = {};
  for (const note of getEntity('notes')) {
    const { clientId, ...rest } = note;
    (notes[clientId] ??= []).push(rest);
  }
  data.notes = notes;
  return data;
}

export function resetAll() {
  db.exec('BEGIN');
  try {
    for (const table of ENTITIES) db.exec(`DELETE FROM "${table}"`);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function isEntity(name) {
  return ENTITIES.includes(name);
}
