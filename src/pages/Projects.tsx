import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, Square, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ProjectStatusBadge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AddProjectModal } from '@/components/projects/AddProjectModal';
import { teamMembers } from '@/data/mockData';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Project } from '@/types';

function teamMember(initials: string) {
  return teamMembers.find((m) => m.initials === initials);
}

export function Projects() {
  const location = useLocation();
  const { projects, toggleDeliverable, deleteProject } = useData();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(Boolean((location.state as { openNew?: boolean } | null)?.openNew));
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`${projects.filter((p) => p.status !== 'completed').length} active, ${projects.filter((p) => p.status === 'completed').length} completed`}
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            New Project
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const isOpen = expanded === project.id;
          const doneCount = project.deliverables.filter((d) => d.done).length;
          return (
            <Card key={project.id} className="flex flex-col p-4 transition-transform duration-200 sm:p-5 sm:hover:-translate-y-0.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-slate-900 dark:text-white">{project.name}</h3>
                  <p className="truncate text-xs text-slate-400">{project.clientName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ProjectStatusBadge status={project.status} />
                  <button
                    onClick={() => setEditingProject(project)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-300"
                    aria-label="Edit project"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingProject(project)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10"
                    aria-label="Delete project"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400 sm:mt-4">
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Calendar className="size-3.5 shrink-0" /> <span className="truncate">Due {formatDate(project.deadline)}</span>
                </span>
                <span className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{formatCurrency(project.budget)}</span>
              </div>

              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      project.status === 'delayed' ? 'bg-rose-500' : project.status === 'at-risk' ? 'bg-amber-500' : 'bg-brand-500',
                    )}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 sm:mt-4">
                <div className="flex -space-x-2">
                  {project.team.map((initial) => {
                    const member = teamMember(initial);
                    return <Avatar key={initial} name={member?.name ?? initial} color={member?.color} size="sm" />;
                  })}
                  {project.team.length === 0 && <span className="text-xs text-slate-400">Unassigned</span>}
                </div>
                <button
                  onClick={() => setExpanded(isOpen ? null : project.id)}
                  className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  {doneCount}/{project.deliverables.length} deliverables
                </button>
              </div>

              {isOpen && (
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3.5 dark:border-white/5 animate-fade-in">
                  {project.deliverables.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => toggleDeliverable(project.id, d.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      {d.done ? (
                        <CheckSquare className="size-4 shrink-0 text-brand-500" />
                      ) : (
                        <Square className="size-4 shrink-0 text-slate-300 dark:text-slate-600" />
                      )}
                      <span className={cn('text-slate-600 dark:text-slate-300', d.done && 'text-slate-400 line-through dark:text-slate-500')}>
                        {d.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <AddProjectModal
        open={addOpen || Boolean(editingProject)}
        onClose={() => {
          setAddOpen(false);
          setEditingProject(null);
        }}
        project={editingProject ?? undefined}
      />

      <ConfirmModal
        open={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={() => {
          if (!deletingProject) return;
          deleteProject(deletingProject.id);
          showToast(`${deletingProject.name} was deleted.`, 'success');
          setDeletingProject(null);
        }}
        title="Delete this project?"
        description={`This will permanently remove "${deletingProject?.name}" and its deliverables. This can't be undone.`}
        confirmLabel="Delete Project"
      />
    </div>
  );
}
