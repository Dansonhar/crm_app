// In dev this points at the local Express server (npm run server); in production
// it points at the deployed Cloudflare Worker (see worker/index.js), which holds
// the bot token as a real server-side secret and exposes the same API shape.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function apiFetch(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error('Could not reach the messaging server. Is it running? (npm run server)');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request to the messaging server failed');
  }
  return data;
}

export async function sendTelegramMessage(chatId: string, message: string) {
  return apiFetch('/api/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  }) as Promise<{ ok: true; messageId?: number }>;
}

export async function notifyTeam(text: string) {
  return apiFetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }) as Promise<{ ok: true; messageId?: number }>;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const DIVIDER = '━━━━━━━━━━━━━━━━━━';

function formatTimestamp(date: Date) {
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} • ${timePart}`;
}

export function priorityEmoji(priority: string) {
  if (priority === 'high') return '🔴';
  if (priority === 'low') return '🟢';
  return '🟡';
}

export interface AlertField {
  label: string;
  value: string;
  bold?: boolean;
}

export function formatEventAlert(intro: string, fields: AlertField[], actions?: string[], timestamp = new Date()) {
  const fieldLines = fields.map(
    (f) => `<b>${escapeHtml(f.label)}:</b> ${f.bold ? `<b>${escapeHtml(f.value)}</b>` : escapeHtml(f.value)}`,
  );
  const parts = [
    '🔔 <b>AgencyFlow CRM Alert</b>',
    '',
    escapeHtml(intro),
    '',
    DIVIDER,
    ...fieldLines,
    DIVIDER,
  ];
  if (actions && actions.length > 0) {
    parts.push('', '✅ <b>Recommended Action</b>', ...actions.map((a) => `• ${escapeHtml(a)}`));
  }
  parts.push('', `⏰ ${formatTimestamp(timestamp)}`);
  return parts.join('\n');
}

export interface ReportSection {
  heading: string;
  lines: string[];
}

export function formatSummaryAlert(subtitle: string, sections: ReportSection[], timestamp = new Date()) {
  const body = sections
    .map((s) => `<b>${escapeHtml(s.heading)}</b>\n${s.lines.map(escapeHtml).join('\n')}`)
    .join('\n\n');
  const parts = [
    '🔔 <b>AgencyFlow CRM Alert</b>',
    '',
    '📊 <b>Executive Summary</b>',
    `<i>${escapeHtml(subtitle)}</i>`,
    '',
    DIVIDER,
    body,
    DIVIDER,
    '',
    `⏰ ${formatTimestamp(timestamp)}`,
  ];
  return parts.join('\n');
}
