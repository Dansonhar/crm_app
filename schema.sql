-- Cloudflare D1 schema for the AgencyFlow CRM.
-- Mirrors the SQLite tables defined in server/db.js so the deployed Worker
-- persists the same data shape as the local Express server.
--
-- Apply with:
--   npx wrangler d1 execute agencyflow-crm-db --file=./schema.sql --remote
--
-- JSON columns (tags, team, deliverables, items) hold serialized arrays as TEXT,
-- exactly like the local server.

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  industry TEXT,
  website TEXT,
  address TEXT,
  lastContacted TEXT,
  createdAt TEXT,
  avatarColor TEXT,
  tags TEXT,
  telegramChatId TEXT,
  telegramUsername TEXT
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  clientName TEXT,
  company TEXT,
  dealValue REAL,
  source TEXT,
  priority TEXT,
  nextFollowUp TEXT,
  stage TEXT,
  avatarColor TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  clientId TEXT,
  clientName TEXT,
  deadline TEXT,
  progress REAL,
  status TEXT,
  team TEXT,
  deliverables TEXT,
  budget REAL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT,
  clientId TEXT,
  clientName TEXT,
  amount REAL,
  issueDate TEXT,
  dueDate TEXT,
  status TEXT,
  items TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT,
  priority TEXT,
  dueDate TEXT,
  clientId TEXT,
  clientName TEXT,
  status TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT,
  description TEXT,
  timestamp TEXT,
  clientId TEXT,
  clientName TEXT
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  clientId TEXT,
  author TEXT,
  content TEXT,
  createdAt TEXT
);
