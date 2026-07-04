const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
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
