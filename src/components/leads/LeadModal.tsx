import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import type { Lead, LeadStage, Priority } from '@/types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200';

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{children}</label>;
}

const emptyForm = {
  clientName: '',
  company: '',
  dealValue: '',
  source: 'Referral',
  priority: 'medium' as Priority,
  nextFollowUp: new Date().toISOString().slice(0, 10),
  stage: 'new' as LeadStage,
};

export function LeadModal({ open, onClose, lead }: { open: boolean; onClose: () => void; lead?: Lead | null }) {
  const { addLead, updateLead } = useData();
  const { showToast } = useToast();
  const isEdit = Boolean(lead);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (lead) {
      setForm({
        clientName: lead.clientName,
        company: lead.company,
        dealValue: String(lead.dealValue),
        source: lead.source,
        priority: lead.priority,
        nextFollowUp: lead.nextFollowUp,
        stage: lead.stage,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, lead]);

  function handleSubmit() {
    if (!form.clientName.trim() || !form.company.trim()) {
      showToast('Enter a contact name and company.', 'error');
      return;
    }
    const dealValue = Number(form.dealValue) || 0;
    if (isEdit && lead) {
      updateLead(lead.id, {
        clientName: form.clientName.trim(),
        company: form.company.trim(),
        dealValue,
        source: form.source,
        priority: form.priority,
        nextFollowUp: form.nextFollowUp,
        stage: form.stage,
      });
      showToast(`${form.clientName} was updated.`, 'success');
    } else {
      addLead({
        clientName: form.clientName.trim(),
        company: form.company.trim(),
        dealValue,
        source: form.source,
        priority: form.priority,
        nextFollowUp: form.nextFollowUp,
      });
      showToast(`${form.clientName} was added to the pipeline.`, 'success');
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Lead' : 'New Lead'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Contact Name</FieldLabel>
            <input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="Jane Cooper"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Company</FieldLabel>
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Acme Co."
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Deal Value ($)</FieldLabel>
            <input
              type="number"
              value={form.dealValue}
              onChange={(e) => setForm({ ...form, dealValue: e.target.value })}
              placeholder="25000"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Source</FieldLabel>
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputClass}>
              <option>Referral</option>
              <option>Website</option>
              <option>LinkedIn</option>
              <option>Conference</option>
              <option>Cold Outreach</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Priority</FieldLabel>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className={inputClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <FieldLabel>Next Follow-up</FieldLabel>
            <input
              type="date"
              value={form.nextFollowUp}
              onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        {isEdit && (
          <div>
            <FieldLabel>Stage</FieldLabel>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value as LeadStage })}
              className={inputClass}
            >
              <option value="new">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="proposal">Proposal Sent</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            {isEdit ? 'Save Changes' : 'Add Lead'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
