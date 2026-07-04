const TELEGRAM_API = 'https://api.telegram.org';

export async function sendTelegramMessage(botToken, chatId, text, options = {}) {
  const response = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
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

export async function getTelegramUpdates(botToken) {
  const response = await fetch(`${TELEGRAM_API}/bot${botToken}/getUpdates`);
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API request failed');
  }
  return data.result;
}
