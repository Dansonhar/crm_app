import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendTelegramMessage, getTelegramUpdates } from './telegram.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
    const signedMessage = `<b>${AGENCY_NAME} CRM</b>\n<i>Automated Notification</i>\n\n${text}`;
    const result = await sendTelegramMessage(BOT_TOKEN, NOTIFY_CHAT_ID, signedMessage, { parseMode: 'HTML' });
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
