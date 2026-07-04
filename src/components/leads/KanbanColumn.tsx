import { useDroppable } from '@dnd-kit/core';
import { cn, formatCurrency } from '@/lib/utils';
import { LeadCard } from './LeadCard';
import type { Lead, LeadStage } from '@/types';

export function KanbanColumn({
  stage,
  label,
  accent,
  leads,
  onEdit,
  onDelete,
}: {
  stage: LeadStage;
  label: string;
  accent: string;
  leads: Lead[];
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalValue = leads.reduce((sum, l) => sum + l.dealValue, 0);

  return (
    <div className="flex w-full flex-col sm:w-72 sm:shrink-0">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 rounded-full', accent)} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</h3>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
            {leads.length}
          </span>
        </div>
      </div>
      <p className="mb-3 px-1 text-xs font-medium text-slate-400">{formatCurrency(totalValue)}</p>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[200px] flex-1 flex-col gap-2.5 rounded-2xl border-2 border-dashed border-transparent p-2 transition-colors',
          isOver && 'border-brand-400/60 bg-brand-500/5',
        )}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-xs text-slate-300 dark:border-white/10 dark:text-slate-600">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
}
