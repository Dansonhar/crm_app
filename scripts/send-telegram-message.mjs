import { sendTelegramMessage } from '../server/telegram.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.CHAT_ID_OVERRIDE || process.env.NOTIFY_CHAT_ID;
const message = process.env.MESSAGE;

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN secret.');
  process.exit(1);
}
if (!chatId) {
  console.error('No chat ID: set the NOTIFY_CHAT_ID secret or pass a chat_id input.');
  process.exit(1);
}
if (!message) {
  console.error('Missing message input.');
  process.exit(1);
}

await sendTelegramMessage(token, chatId, message, { parseMode: 'HTML' });
console.log('Message relayed to Telegram.');
