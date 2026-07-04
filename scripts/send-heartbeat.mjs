import { sendTelegramMessage } from '../server/telegram.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.NOTIFY_CHAT_ID;

if (!token || !chatId) {
  console.error('Missing TELEGRAM_BOT_TOKEN or NOTIFY_CHAT_ID secret.');
  process.exit(1);
}

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

// This is a liveness check, not a business report: this repo has no database, so
// there are no real figures a scheduled job (with no browser session attached) could read.
const message = [
  '🔔 <b>AgencyFlow CRM Alert</b>',
  '',
  '💓 Daily automation heartbeat — this scheduled GitHub Action ran successfully.',
  '',
  DIVIDER,
  'This confirms the Telegram notification pipeline is alive and connected.',
  'Live business figures require an open CRM session — open the app to see real-time numbers and trigger live alerts.',
  DIVIDER,
  '',
  `⏰ ${timestamp} UTC`,
].join('\n');

await sendTelegramMessage(token, chatId, message, { parseMode: 'HTML' });
console.log('Heartbeat sent.');
