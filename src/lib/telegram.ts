// Local dev: relay through the Express backend (npm run server).
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Production (GitHub Pages): dispatch a GitHub Actions workflow run instead,
// since Pages can't host a server. The token is baked into this static build
// by the deploy workflow — see .github/workflows/deploy.yml and notify.yml.
const GITHUB_DISPATCH_TOKEN = import.meta.env.VITE_GITHUB_DISPATCH_TOKEN as string | undefined;
const GITHUB_REPO = 'Dansonhar/crm_app';
const GITHUB_WORKFLOW = 'notify.yml';

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

async function dispatchGitHubWorkflow(message: string, chatId?: string) {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_DISPATCH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs: chatId ? { message, chat_id: chatId } : { message } }),
    },
  );
  if (response.status !== 204) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `GitHub Actions dispatch failed (${response.status})`);
  }
  return { ok: true as const, queued: true as const };
}

export async function sendTelegramMessage(chatId: string, message: string) {
  if (GITHUB_DISPATCH_TOKEN) return dispatchGitHubWorkflow(message, chatId);
  return apiFetch('/api/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  }) as Promise<{ ok: true; queued?: true }>;
}

export async function notifyTeam(text: string) {
  if (GITHUB_DISPATCH_TOKEN) return dispatchGitHubWorkflow(text);
  return apiFetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }) as Promise<{ ok: true; queued?: true }>;
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
