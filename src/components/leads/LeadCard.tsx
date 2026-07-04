import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Tag, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge } from '@/components/ui/Badge';
import { cn, formatCurrency, formatShortDate } from '@/lib/utils';
import type { Lead } from '@/types';

export function LeadCard({
  lead,
  overlay = false,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  overlay?: boolean;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: lead,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'group relative cursor-grab select-none rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-white/[0.06] dark:bg-surface-900',
        isDragging && !overlay && 'opacity-30',
        overlay && 'rotate-2 shadow-xl',
      )}
    >
      {!overlay && (onEdit || onDelete) && (
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              className="rounded-lg bg-white p-1.5 text-slate-300 shadow-sm hover:bg-slate-100 hover:text-slate-500 dark:bg-surface-900 dark:text-slate-600 dark:hover:bg-white/10"
              aria-label="Edit lead"
            >
              <Pencil className="size-3" />
            </button>
          )}
          {onDelete && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lead);
              }}
              className="rounded-lg bg-white p-1.5 text-slate-300 shadow-sm hover:bg-rose-50 hover:text-rose-500 dark:bg-surface-900 dark:text-slate-600 dark:hover:bg-rose-500/10"
              aria-label="Delete lead"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={lead.clientName} color={lead.avatarColor} size="sm" />
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-800 dark:text-white">{lead.clientName}</p>
            <p className="text-xs text-slate-400">{lead.company}</p>
          </div>
        </div>
        <PriorityBadge priority={lead.priority} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-bold text-slate-900 dark:text-white">{formatCurrency(lead.dealValue)}</span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Tag className="size-3" /> {lead.source}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-50 pt-2.5 text-xs text-slate-400 dark:border-white/5">
        <Calendar className="size-3.5" />
        Next follow-up {formatShortDate(lead.nextFollowUp)}
      </div>
    </div>
  );
}
