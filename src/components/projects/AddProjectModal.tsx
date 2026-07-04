import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import type { Project, ProjectStatus } from '@/types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200';

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{children}</label>;
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
  const { showToast } = useToast();
  const isEdit = Boolean(project);

  const [form, setForm] = useState(emptyForm);

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
    } else {
      setForm({ ...emptyForm, clientId: lockedClientId ?? clients[0]?.id ?? '' });
    }
  }, [open, project, lockedClientId, clients]);

  function handleSubmit() {
    const client = clients.find((c) => c.id === form.clientId);
    if (!form.name.trim() || !client) {
      showToast('Enter a project name and select a client.', 'error');
      return;
    }
    if (isEdit && project) {
      updateProject(project.id, {
        name: form.name.trim(),
        clientId: client.id,
        clientName: client.name,
        deadline: form.deadline,
        budget: Number(form.budget) || 0,
        status: form.status,
      });
      showToast(`${form.name} was updated.`, 'success');
    } else {
      addProject({
        name: form.name.trim(),
        clientId: client.id,
        clientName: client.name,
        deadline: form.deadline,
        budget: Number(form.budget) || 0,
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
            <FieldLabel>Budget ($)</FieldLabel>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="25000"
              className={inputClass}
            />
          </div>
        </div>
        {isEdit && (
          <div>
            <FieldLabel>Status</FieldLabel>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
              className={inputClass}
            >
              <option value="on-track">On Track</option>
              <option value="at-risk">At Risk</option>
              <option value="delayed">Delayed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
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
