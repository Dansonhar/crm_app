import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Plus, User, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PriorityBadge, TagBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { cn, formatDate } from '@/lib/utils';
import { useUrlState } from '@/lib/useUrlState';
import type { Priority, Task } from '@/types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200';

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{children}</label>;
}

function nextDays(count: number) {
  const days = [];
  const base = new Date('2026-07-04T00:00:00');
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

const emptyForm = {
  title: '',
  priority: 'medium' as Priority,
  dueDate: new Date().toISOString().slice(0, 10),
  clientId: '',
  category: 'Follow-up',
};

export function Tasks() {
  const location = useLocation();
  const { clients, tasks, addTask, updateTask, deleteTask, toggleTask } = useData();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useUrlState('filter', 'pending');
  const [addOpen, setAddOpen] = useState(Boolean((location.state as { openNew?: boolean } | null)?.openNew));
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);

  const days = useMemo(() => nextDays(7), []);

  const tasksByDate = useMemo(() => {
    const map: Record<string, number> = {};
    tasks
      .filter((t) => t.status === 'pending')
      .forEach((t) => {
        map[t.dueDate] = (map[t.dueDate] ?? 0) + 1;
      });
    return map;
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => (filter === 'all' ? true : t.status === filter))
      .filter((t) => (selectedDate ? t.dueDate === selectedDate : true))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, filter, selectedDate]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const isEdit = Boolean(editingTask);

  function openAddModal() {
    setForm(emptyForm);
    setAddOpen(true);
  }

  function openEditModal(task: Task) {
    setForm({
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      clientId: task.clientId ?? '',
      category: task.category,
    });
    setEditingTask(task);
  }

  function closeModal() {
    setAddOpen(false);
    setEditingTask(null);
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      showToast('Enter a task title.', 'error');
      return;
    }
    const client = clients.find((c) => c.id === form.clientId);
    if (isEdit && editingTask) {
      updateTask(editingTask.id, {
        title: form.title.trim(),
        priority: form.priority,
        dueDate: form.dueDate,
        clientId: client?.id,
        clientName: client?.name,
        category: form.category,
      });
      showToast('Task updated.', 'success');
    } else {
      addTask({
        title: form.title.trim(),
        priority: form.priority,
        dueDate: form.dueDate,
        clientId: client?.id,
        clientName: client?.name,
        category: form.category,
      });
      showToast('Task added.', 'success');
    }
    closeModal();
  }

  return (
    <div>
      <PageHeader
        title="Tasks & Follow-ups"
        description={`${pendingCount} tasks pending`}
        actions={
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            New Task
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex gap-1.5">
            {(['pending', 'completed', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition-colors',
                  filter === f
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                    : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-surface-900 dark:text-slate-400 dark:hover:bg-white/5',
                )}
              >
                {f}
              </button>
            ))}
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="rounded-lg bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400"
              >
                Clear date filter
              </button>
            )}
          </div>

          <Card className="divide-y divide-slate-50 p-0 dark:divide-white/[0.04]">
            {filtered.map((task) => (
              <div key={task.id} className="group flex items-start gap-3.5 p-4">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                    task.status === 'completed'
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-slate-300 hover:border-brand-400 dark:border-slate-600',
                  )}
                >
                  {task.status === 'completed' && <Check className="size-3.5" strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium text-slate-700 dark:text-slate-200',
                      task.status === 'completed' && 'text-slate-400 line-through dark:text-slate-500',
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <TagBadge>{task.category}</TagBadge>
                    {task.clientName && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <User className="size-3" /> {task.clientName}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{formatDate(task.dueDate)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEditModal(task)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-300"
                    aria-label="Edit task"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingTask(task)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10"
                    aria-label="Delete task"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-400">No tasks found.</div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7 lg:grid-cols-1">
                {days.map((day) => {
                  const iso = day.toISOString().slice(0, 10);
                  const count = tasksByDate[iso] ?? 0;
                  const isSelected = selectedDate === iso;
                  return (
                    <button
                      key={iso}
                      onClick={() => setSelectedDate(isSelected ? null : iso)}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-2.5 text-left transition-colors lg:flex-row',
                        isSelected
                          ? 'border-brand-400 bg-brand-500/10'
                          : 'border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5',
                      )}
                    >
                      <div className="flex flex-col items-center lg:flex-row lg:gap-2">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{day.getDate()}</span>
                      </div>
                      {count > 0 && (
                        <span className="hidden rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white lg:inline-block">
                          {count}
                        </span>
                      )}
                      {count > 0 && (
                        <span className="mt-1 size-1.5 rounded-full bg-brand-500 lg:hidden" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={addOpen || isEdit} onClose={closeModal} title={isEdit ? 'Edit Task' : 'New Task'}>
        <div className="space-y-4">
          <div>
            <FieldLabel>Task Title</FieldLabel>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Follow up on proposal"
              className={inputClass}
            />
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
              <FieldLabel>Due Date</FieldLabel>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Related Client (optional)</FieldLabel>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inputClass}>
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} &middot; {c.company}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
              <option>Follow-up</option>
              <option>Call</option>
              <option>Meeting</option>
              <option>Billing</option>
              <option>Deliverable</option>
              <option>Internal</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
              Cancel
            </button>
            <button onClick={handleSubmit} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              {isEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={() => {
          if (!deletingTask) return;
          deleteTask(deletingTask.id);
          showToast('Task deleted.', 'success');
        }}
        title="Delete this task?"
        description={`This will permanently remove "${deletingTask?.title}". This can't be undone.`}
        confirmLabel="Delete Task"
      />
    </div>
  );
}
