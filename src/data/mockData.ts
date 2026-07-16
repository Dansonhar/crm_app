import type {
  Activity,
  Client,
  ClientNote,
  Invoice,
  Lead,
  Project,
  Task,
} from '@/types';

export const avatarColors = [
  'bg-brand-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-indigo-500',
];

// CRM records start empty — data is stored in and loaded from the SQLite
// database via the backend API (see src/lib/api.ts and server/db.js).
// Add records through the app UI; they persist to the database.
export const clients: Client[] = [];

export const leads: Lead[] = [];

export const projects: Project[] = [];

export const invoices: Invoice[] = [];

export const tasks: Task[] = [];

export const activities: Activity[] = [];

export const clientNotes: Record<string, ClientNote[]> = {};

// Reset — no team roster for project avatars yet.
export const teamMembers: { initials: string; name: string; role: string; color: string }[] = [];

// Reset — no monthly revenue history yet.
export const revenueByMonth: { month: string; revenue: number; expenses: number }[] = [];

export const leadConversion = [
  { stage: 'New', value: 4 },
  { stage: 'Contacted', value: 3 },
  { stage: 'Proposal', value: 3 },
  { stage: 'Negotiation', value: 2 },
  { stage: 'Won', value: 2 },
];
