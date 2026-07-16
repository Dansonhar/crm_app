import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ClientStatus, InvoiceStatus, Priority, ProjectStatus } from '@/types';

function Base({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  );
}

const clientStatusStyles: Record<ClientStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  inactive: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  lead: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Base className={clientStatusStyles[status]}>
      <span className="size-1.5 rounded-full bg-current" />
      {status[0].toUpperCase() + status.slice(1)}
    </Base>
  );
}

// Cycle order used when the status badge is clicked to change it inline.
const clientStatusCycle: ClientStatus[] = ['lead', 'active', 'inactive'];

// A clickable status badge — clicking cycles to the next status and fires
// onChange immediately (used in the clients table, list, and detail header).
export function ClientStatusButton({
  status,
  onChange,
}: {
  status: ClientStatus;
  onChange: (next: ClientStatus) => void;
}) {
  const next = clientStatusCycle[(clientStatusCycle.indexOf(status) + 1) % clientStatusCycle.length];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onChange(next);
      }}
      title={`Click to set status to ${next[0].toUpperCase() + next.slice(1)}`}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none whitespace-nowrap transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        clientStatusStyles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status[0].toUpperCase() + status.slice(1)}
    </button>
  );
}

const invoiceStatusStyles: Record<InvoiceStatus, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  overdue: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Base className={invoiceStatusStyles[status]}>
      <span className="size-1.5 rounded-full bg-current" />
      {status[0].toUpperCase() + status.slice(1)}
    </Base>
  );
}

const projectStatusStyles: Record<ProjectStatus, string> = {
  'on-track': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'at-risk': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  delayed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  completed: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
};

const projectStatusLabels: Record<ProjectStatus, string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  delayed: 'Delayed',
  completed: 'Completed',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Base className={projectStatusStyles[status]}>
      <span className="size-1.5 rounded-full bg-current" />
      {projectStatusLabels[status]}
    </Base>
  );
}

const priorityStyles: Record<Priority, string> = {
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  low: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Base className={priorityStyles[priority]}>
      {priority[0].toUpperCase() + priority.slice(1)}
    </Base>
  );
}

export function TagBadge({ children }: { children: ReactNode }) {
  return (
    <Base className="bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
      {children}
    </Base>
  );
}
