import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendTelegramMessage, getTelegramUpdates } from './telegram.js';
import { getAllData, replaceEntity, resetAll, isEntity } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 4000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const AGENCY_NAME = process.env.AGENCY_NAME || 'AgencyFlow';
const NOTIFY_CHAT_ID = process.env.NOTIFY_CHAT_ID;

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    bot: BOT_USERNAME ?? null,
    agency: AGENCY_NAME,
    notifyChatConfigured: Boolean(NOTIFY_CHAT_ID),
    uptime: process.uptime(),
  });
});

// --- CRM data persistence (SQLite via server/db.js) ---

// Return the full CRM state: clients, leads, projects, invoices, tasks,
// activities, and notes (keyed by client id).
app.get('/api/data', (_req, res) => {
  try {
    res.json(getAllData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Replace all rows of a single entity with the provided array.
// Body: { rows: [...] }. The frontend calls this after any local mutation.
app.put('/api/data/:entity', (req, res) => {
  const { entity } = req.params;
  if (!isEntity(entity)) {
    return res.status(404).json({ error: `Unknown entity "${entity}"` });
  }
  const rows = req.body?.rows;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ error: 'Body must be { rows: [...] }' });
  }
  try {
    replaceEntity(entity, rows);
    res.json({ ok: true, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wipe every table — used by the "reset" action.
app.post('/api/data/reset', (_req, res) => {
  try {
    resetAll();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper for finding a client's chat ID: have them message the bot once,
// then hit this endpoint to see the chat IDs of everyone who has done so.
app.get('/api/telegram/updates', async (_req, res) => {
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not set on the server' });
  }
  try {
    const updates = await getTelegramUpdates(BOT_TOKEN);
    const chats = updates
      .map((update) => update.message?.chat)
      .filter(Boolean)
      .map((chat) => ({
        chatId: chat.id,
        name: [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.title || null,
        username: chat.username ?? null,
      }));
    res.json({ chats });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/send-message', async (req, res) => {
  const { chatId, message } = req.body ?? {};
  if (!chatId || !message) {
    return res.status(400).json({ error: 'chatId and message are required' });
  }
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not set on the server' });
  }
  try {
    const signedMessage = `${AGENCY_NAME}\n\n${message}`;
    const result = await sendTelegramMessage(BOT_TOKEN, chatId, signedMessage);
    res.json({ ok: true, messageId: result.message_id });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Internal notifications: new leads, deals, projects, invoices — posted to one team chat.
app.post('/api/notify', async (req, res) => {
  const { text } = req.body ?? {};
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not set on the server' });
  }
  if (!NOTIFY_CHAT_ID) {
    return res.status(500).json({ error: 'NOTIFY_CHAT_ID is not set on the server' });
  }
  try {
    // The frontend builds the full formatted alert card (header, dividers, timestamp) itself,
    // so it can tailor the layout per event type — just relay it as-is.
    const result = await sendTelegramMessage(BOT_TOKEN, NOTIFY_CHAT_ID, text, { parseMode: 'HTML' });
    res.json({ ok: true, messageId: result.message_id });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`${AGENCY_NAME} messaging server running on http://localhost:${PORT}`);
  if (!BOT_TOKEN) {
    console.warn('Warning: TELEGRAM_BOT_TOKEN is not set — sending will fail until it is configured in .env');
  }
});
