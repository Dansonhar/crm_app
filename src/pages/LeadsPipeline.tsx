import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { KanbanColumn } from '@/components/leads/KanbanColumn';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadModal } from '@/components/leads/LeadModal';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';
import type { Lead, LeadStage } from '@/types';

const columns: { stage: LeadStage; label: string; accent: string }[] = [
  { stage: 'new', label: 'New Lead', accent: 'bg-sky-500' },
  { stage: 'contacted', label: 'Contacted', accent: 'bg-amber-500' },
  { stage: 'proposal', label: 'Proposal Sent', accent: 'bg-violet-500' },
  { stage: 'negotiation', label: 'Negotiation', accent: 'bg-orange-500' },
  { stage: 'won', label: 'Won', accent: 'bg-emerald-500' },
  { stage: 'lost', label: 'Lost', accent: 'bg-rose-500' },
];

export function LeadsPipeline() {
  const { leads, updateLead, deleteLead } = useData();
  const { showToast } = useToast();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const totalPipelineValue = leads
    .filter((l) => l.stage !== 'lost')
    .reduce((sum, l) => sum + l.dealValue, 0);

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;
    const newStage = over.id as LeadStage;
    updateLead(active.id as string, { stage: newStage });
  }

  return (
    <div>
      <PageHeader
        title="Leads Pipeline"
        description={`${leads.filter((l) => l.stage !== 'lost' && l.stage !== 'won').length} active deals worth ${formatCurrency(totalPipelineValue)}`}
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            New Lead
          </button>
        }
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 sm:overflow-x-auto sm:pb-4 sm:scrollbar-thin">
          {columns.map((col) => (
            <KanbanColumn
              key={col.stage}
              stage={col.stage}
              label={col.label}
              accent={col.accent}
              leads={leads.filter((l) => l.stage === col.stage)}
              onEdit={setEditingLead}
              onDelete={setDeletingLead}
            />
          ))}
        </div>
        <DragOverlay>{activeLead && <LeadCard lead={activeLead} overlay />}</DragOverlay>
      </DndContext>

      <LeadModal open={addOpen} onClose={() => setAddOpen(false)} />
      <LeadModal open={Boolean(editingLead)} onClose={() => setEditingLead(null)} lead={editingLead} />

      <ConfirmModal
        open={Boolean(deletingLead)}
        onClose={() => setDeletingLead(null)}
        onConfirm={() => {
          if (!deletingLead) return;
          deleteLead(deletingLead.id);
          showToast(`${deletingLead.clientName} was removed from the pipeline.`, 'success');
        }}
        title="Delete this lead?"
        description={`This will permanently remove ${deletingLead?.clientName} (${deletingLead?.company}) from the pipeline. This can't be undone.`}
        confirmLabel="Delete Lead"
      />
    </div>
  );
}
