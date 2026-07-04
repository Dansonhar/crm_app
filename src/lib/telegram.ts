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
  }) as Promise<{ ok: true; messageId: number }>;
}

export async function notifyTeam(text: string) {
  return apiFetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }) as Promise<{ ok: true; messageId: number }>;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatNotification(title: string, fields: Record<string, string>) {
  const lines = Object.entries(fields).map(
    ([label, value]) => `<b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`,
  );
  return `<b>${escapeHtml(title)}</b>\n\n${lines.join('\n')}`;
}

export interface ReportSection {
  heading: string;
  lines: string[];
}

export function formatReport(title: string, subtitle: string, sections: ReportSection[]) {
  const body = sections
    .map((s) => `<b>${escapeHtml(s.heading)}</b>\n${s.lines.map(escapeHtml).join('\n')}`)
    .join('\n\n');
  return `<b>${escapeHtml(title)}</b>\n<i>${escapeHtml(subtitle)}</i>\n\n${body}`;
}

export interface TelegramChat {
  chatId: string;
  name: string | null;
  username: string | null;
}

export async function getTelegramChats() {
  const data = await apiFetch('/api/telegram/updates');
  return data.chats as TelegramChat[];
}

export async function getBotInfo() {
  const data = await apiFetch('/api/health');
  return data as { status: string; bot: string | null; agency: string; notifyChatConfigured: boolean };
}
