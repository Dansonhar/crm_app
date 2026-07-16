import { useEffect, useState } from 'react';
import { CheckSquare, Square, Plus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import type { Deliverable, Project, ProjectStatus } from '@/types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200';

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'on-track', label: 'On Track' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'completed', label: 'Completed' },
];

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{children}</label>;
}

// A locally-editable deliverable row. `id` is kept so existing ticks survive edits.
type DraftDeliverable = { id: string; label: string; done: boolean };

function makeDraftId() {
  return `d${Date.now()}-${Math.round(performance.now() * 1000)}`;
}

const emptyForm = {
  name: '',
  clientId: '',
  deadline: new Date().toISOString().slice(0, 10),
  budget: '',
  status: 'on-track' as ProjectStatus,
};

export function AddProjectModal({
  open,
  onClose,
  lockedClientId,
  project,
}: {
  open: boolean;
  onClose: () => void;
  lockedClientId?: string;
  project?: Project;
}) {
  const { clients, addProject, updateProject } = useData();
  const { members } = useAuth();
  const { showToast } = useToast();
  const isEdit = Boolean(project);

  const [form, setForm] = useState(emptyForm);
  const [team, setTeam] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<DraftDeliverable[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (!open) return;
    if (project) {
      setForm({
        name: project.name,
        clientId: project.clientId,
        deadline: project.deadline,
        budget: String(project.budget),
        status: project.status,
      });
      setTeam(project.team ?? []);
      setDeliverables((project.deliverables ?? []).map((d) => ({ id: d.id, label: d.label, done: d.done })));
    } else {
      setForm({ ...emptyForm, clientId: lockedClientId ?? clients[0]?.id ?? '' });
      setTeam([]);
      setDeliverables([]);
    }
    setNewItem('');
  }, [open, project, lockedClientId, clients]);

  // Progress is derived from ticked deliverables — shown live so it matches the card.
  const doneCount = deliverables.filter((d) => d.done).length;
  const progress = deliverables.length === 0 ? 0 : Math.round((doneCount / deliverables.length) * 100);

  function toggleMember(id: string) {
    setTeam((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function toggleDone(id: string) {
    setDeliverables((prev) => prev.map((d) => (d.id === id ? { ...d, done: !d.done } : d)));
  }

  function updateLabel(id: string, label: string) {
    setDeliverables((prev) => prev.map((d) => (d.id === id ? { ...d, label } : d)));
  }

  function removeItem(id: string) {
    setDeliverables((prev) => prev.filter((d) => d.id !== id));
  }

  function addItem() {
    const label = newItem.trim();
    if (!label) return;
    setDeliverables((prev) => [...prev, { id: makeDraftId(), label, done: false }]);
    setNewItem('');
  }

  function handleSubmit() {
    const client = clients.find((c) => c.id === form.clientId);
    if (!form.name.trim() || !client) {
      showToast('Enter a project name and select a client.', 'error');
      return;
    }
    const cleaned = deliverables.filter((d) => d.label.trim());
    if (isEdit && project) {
      const nextDeliverables: Deliverable[] = cleaned.map((d) => ({ id: d.id, label: d.label.trim(), done: d.done }));
      updateProject(project.id, {
        name: form.name.trim(),
        clientId: client.id,
        clientName: client.name,
        deadline: form.deadline,
        budget: Number(form.budget) || 0,
        status: form.status,
        team,
        deliverables: nextDeliverables,
      });
      showToast(`${form.name} was updated.`, 'success');
    } else {
      addProject({
        name: form.name.trim(),
        clientId: client.id,
        clientName: client.name,
        deadline: form.deadline,
        budget: Number(form.budget) || 0,
        status: form.status,
        team,
        deliverables: cleaned.map((d) => ({ label: d.label.trim(), done: d.done })),
      });
      showToast(`${form.name} was created for ${client.name}.`, 'success');
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Project' : 'New Project'}>
      <div className="space-y-4">
        <div>
          <FieldLabel>Project Name</FieldLabel>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Website Redesign"
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel>Client</FieldLabel>
          <select
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            disabled={Boolean(lockedClientId)}
            className={`${inputClass} disabled:opacity-60`}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} &middot; {c.company}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Deadline</FieldLabel>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Budget (RM)</FieldLabel>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="25000"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Status</FieldLabel>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
            className={inputClass}
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assign team members — only people added in Settings → Team Members. */}
        <div>
          <FieldLabel>Assign Team Members</FieldLabel>
          {members.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-3.5 py-3 text-xs text-slate-400 dark:border-white/10">
              No team members yet. Add them in Settings → Team Members.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const selected = team.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors',
                      selected
                        ? 'border-brand-400 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5',
                    )}
                  >
                    <Avatar name={m.name} color={m.avatarColor} size="xs" />
                    {m.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Deliverables checklist. Ticking here drives the progress bar. */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel>Work / Deliverables</FieldLabel>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {doneCount}/{deliverables.length} done · {progress}%
            </span>
          </div>
          <div className="space-y-1.5">
            {deliverables.map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDone(d.id)}
                  aria-label={d.done ? 'Mark as not done' : 'Mark as done'}
                  className="shrink-0"
                >
                  {d.done ? (
                    <CheckSquare className="size-4 text-brand-500" />
                  ) : (
                    <Square className="size-4 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
                <input
                  value={d.label}
                  onChange={(e) => updateLabel(d.id, e.target.value)}
                  placeholder="Deliverable name"
                  className={cn(inputClass, 'py-2', d.done && 'text-slate-400 line-through dark:text-slate-500')}
                />
                <button
                  type="button"
                  onClick={() => removeItem(d.id)}
                  aria-label="Remove deliverable"
                  className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="Add a deliverable…"
              className={cn(inputClass, 'py-2')}
            />
            <button
              type="button"
              onClick={addItem}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
          {/* Live progress preview mirrors the project card. */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
            {isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
