const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// --- CRM data persistence (Cloudflare D1) ---
//
// Mirrors the local Express server (server/db.js) so the frontend's data API
// (fetchAllData / persistEntity / resetAllData in src/lib/api.ts) works
// identically against the deployed Worker. Each entity is its own table;
// JSON columns hold serialized arrays.

const TABLES = {
  clients: {
    columns: ['id', 'name', 'company', 'email', 'phone', 'status', 'industry', 'website', 'address', 'lastContacted', 'createdAt', 'avatarColor', 'tags', 'telegramChatId', 'telegramUsername'],
    json: ['tags'],
  },
  leads: {
    columns: ['id', 'clientName', 'company', 'dealValue', 'source', 'priority', 'nextFollowUp', 'stage', 'avatarColor'],
    json: [],
  },
  projects: {
    columns: ['id', 'name', 'clientId', 'clientName', 'deadline', 'progress', 'status', 'team', 'deliverables', 'budget'],
    json: ['team', 'deliverables'],
  },
  invoices: {
    columns: ['id', 'number', 'clientId', 'clientName', 'amount', 'issueDate', 'dueDate', 'status', 'items'],
    json: ['items'],
  },
  tasks: {
    columns: ['id', 'title', 'priority', 'dueDate', 'clientId', 'clientName', 'status', 'category'],
    json: [],
  },
  activities: {
    columns: ['id', 'type', 'description', 'timestamp', 'clientId', 'clientName'],
    json: [],
  },
  notes: {
    columns: ['id', 'clientId', 'author', 'content', 'createdAt'],
    json: [],
  },
};

const ENTITIES = Object.keys(TABLES);
const isEntity = (name) => ENTITIES.includes(name);

// Turn a row object into an ordered value array for a parameterized INSERT.
function serializeRow(table, row) {
  const { columns, json } = TABLES[table];
  return columns.map((name) => {
    if (json.includes(name)) return JSON.stringify(row[name] ?? []);
    return row[name] === undefined ? null : row[name];
  });
}

// Turn a stored DB row back into the shape the frontend expects.
function deserializeRow(table, row) {
  const { json } = TABLES[table];
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null) continue; // drop empty optional fields
    out[key] = json.includes(key) ? JSON.parse(value) : value;
  }
  for (const key of json) {
    if (out[key] === undefined) out[key] = [];
  }
  return out;
}

async function getEntityRows(env, table) {
  const { results } = await env.DB.prepare(`SELECT * FROM "${table}"`).all();
  return (results ?? []).map((r) => deserializeRow(table, r));
}

// Assemble the full CRM state; notes are reshaped into Record<clientId, ClientNote[]>.
async function handleGetData(env) {
  const data = {};
  for (const table of ENTITIES) {
    if (table === 'notes') continue;
    data[table] = await getEntityRows(env, table);
  }
  const notes = {};
  for (const note of await getEntityRows(env, 'notes')) {
    const { clientId, ...rest } = note;
    (notes[clientId] ??= []).push(rest);
  }
  data.notes = notes;
  return json(data);
}

// Replace all rows of one table with the provided array (atomic D1 batch).
async function handlePutEntity(entity, request, env) {
  const body = await request.json().catch(() => ({}));
  const rows = body?.rows;
  if (!Array.isArray(rows)) {
    return json({ error: 'Body must be { rows: [...] }' }, 400);
  }
  const { columns } = TABLES[entity];
  const placeholders = columns.map(() => '?').join(', ');
  const insertSql = `INSERT INTO "${entity}" (${columns.map((n) => `"${n}"`).join(', ')}) VALUES (${placeholders})`;
  const statements = [env.DB.prepare(`DELETE FROM "${entity}"`)];
  for (const row of rows) {
    statements.push(env.DB.prepare(insertSql).bind(...serializeRow(entity, row)));
  }
  await env.DB.batch(statements);
  return json({ ok: true, count: rows.length });
}

async function handleResetData(env) {
  await env.DB.batch(ENTITIES.map((table) => env.DB.prepare(`DELETE FROM "${table}"`)));
  return json({ ok: true });
}

async function sendTelegramMessage(botToken, chatId, text, options = {}) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: options.parseMode }),
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API request failed');
  }
  return data.result;
}

async function handleHealth(env) {
  return json({
    status: 'ok',
    bot: env.TELEGRAM_BOT_USERNAME ?? null,
    agency: env.AGENCY_NAME ?? 'AgencyFlow',
    notifyChatConfigured: Boolean(env.NOTIFY_CHAT_ID),
  });
}

async function handleSendMessage(request, env) {
  const { chatId, message } = await request.json().catch(() => ({}));
  if (!chatId || !message) {
    return json({ error: 'chatId and message are required' }, 400);
  }
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ error: 'TELEGRAM_BOT_TOKEN is not configured' }, 500);
  }
  try {
    const agencyName = env.AGENCY_NAME ?? 'AgencyFlow';
    const result = await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `${agencyName}\n\n${message}`);
    return json({ ok: true, messageId: result.message_id });
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

async function handleNotify(request, env) {
  const { text } = await request.json().catch(() => ({}));
  if (!text) {
    return json({ error: 'text is required' }, 400);
  }
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ error: 'TELEGRAM_BOT_TOKEN is not configured' }, 500);
  }
  if (!env.NOTIFY_CHAT_ID) {
    return json({ error: 'NOTIFY_CHAT_ID is not configured' }, 500);
  }
  try {
    // The frontend builds the full formatted alert card (header, dividers, timestamp) itself,
    // so it can tailor the layout per event type — just relay it as-is.
    const result = await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.NOTIFY_CHAT_ID, text, { parseMode: 'HTML' });
    return json({ ok: true, messageId: result.message_id });
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

function buildHeartbeatMessage() {
  const DIVIDER = '━━━━━━━━━━━━━━━━━━';
  const timestamp = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
  return [
    '🔔 <b>AgencyFlow CRM Alert</b>',
    '',
    '💓 Daily automation heartbeat — this scheduled Cloudflare Worker run succeeded.',
    '',
    DIVIDER,
    'This confirms the Telegram notification pipeline is alive and connected.',
    'Live business figures require an open CRM session — open the app to see real-time numbers and trigger live alerts.',
    DIVIDER,
    '',
    `⏰ ${timestamp} UTC`,
  ].join('\n');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return handleHealth(env);
    }
    if (url.pathname === '/api/send-message' && request.method === 'POST') {
      return handleSendMessage(request, env);
    }
    if (url.pathname === '/api/notify' && request.method === 'POST') {
      return handleNotify(request, env);
    }

    // --- CRM data API (Cloudflare D1) ---
    if (url.pathname.startsWith('/api/data')) {
      if (!env.DB) {
        return json({ error: 'D1 database binding "DB" is not configured on this Worker.' }, 500);
      }
      try {
        if (url.pathname === '/api/data' && request.method === 'GET') {
          return await handleGetData(env);
        }
        if (url.pathname === '/api/data/reset' && request.method === 'POST') {
          return await handleResetData(env);
        }
        const entityMatch = url.pathname.match(/^\/api\/data\/([^/]+)$/);
        if (entityMatch && request.method === 'PUT') {
          const entity = entityMatch[1];
          if (!isEntity(entity)) {
            return json({ error: `Unknown entity "${entity}"` }, 404);
          }
          return await handlePutEntity(entity, request, env);
        }
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    return json({ error: 'Not found' }, 404);
  },

  // Daily heartbeat — confirms the pipeline is alive even if nobody opens the app.
  async scheduled(_event, env) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.NOTIFY_CHAT_ID) return;
    await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.NOTIFY_CHAT_ID, buildHeartbeatMessage(), {
      parseMode: 'HTML',
    });
  },
};
