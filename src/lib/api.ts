// Client for the CRM data API served by the Express backend (server/index.js),
// which persists everything to SQLite. In dev this points at the local server;
// in production at the deployed Worker (same VITE_API_BASE_URL as messaging).
import type {
  Activity,
  Client,
  ClientNote,
  Invoice,
  Lead,
  Project,
  Task,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface CrmData {
  clients: Client[];
  leads: Lead[];
  projects: Project[];
  invoices: Invoice[];
  tasks: Task[];
  activities: Activity[];
  notes: Record<string, ClientNote[]>;
}

// Entity names that map to their own table on the backend. `notes` is handled
// separately because it is stored keyed by client id.
export type PersistableEntity =
  | 'clients'
  | 'leads'
  | 'projects'
  | 'invoices'
  | 'tasks'
  | 'activities'
  | 'notes';

async function apiFetch(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error('Could not reach the data server. Is it running? (npm run server)');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request to the data server failed');
  }
  return data;
}

export async function fetchAllData(): Promise<CrmData> {
  return apiFetch('/api/data') as Promise<CrmData>;
}

// Replace all rows of one entity. For `notes`, pass the flattened row array
// (each row carrying its clientId); everything else passes its state array.
export async function persistEntity(
  entity: PersistableEntity,
  rows: unknown[],
): Promise<void> {
  await apiFetch(`/api/data/${entity}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
}

export async function resetAllData(): Promise<void> {
  await apiFetch('/api/data/reset', { method: 'POST' });
}

// Flatten the UI's Record<clientId, ClientNote[]> into rows for persistence.
export function flattenNotes(notes: Record<string, ClientNote[]>) {
  return Object.entries(notes).flatMap(([clientId, list]) =>
    list.map((note) => ({ ...note, clientId })),
  );
}
