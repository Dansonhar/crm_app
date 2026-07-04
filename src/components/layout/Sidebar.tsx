import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  FolderKanban,
  Receipt,
  CheckSquare,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/leads', label: 'Leads Pipeline', icon: KanbanSquare },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out dark:border-white/[0.06] dark:bg-surface-925 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-500/30">
              <Sparkles className="size-5" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900 dark:text-white">AgencyFlow</p>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">CRM Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'size-[18px] shrink-0 transition-colors',
                      isActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                    )}
                    strokeWidth={2}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-700/10 p-4 dark:from-brand-500/15 dark:to-brand-900/20">
          <p className="text-xs font-semibold text-slate-800 dark:text-white">Upgrade to Pro</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Unlock automation, reporting, and unlimited client seats.
          </p>
          <button
            onClick={() => showToast("This is a demo workspace — upgrades aren't available, but thanks for checking!", 'info')}
            className="mt-3 w-full rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Upgrade Workspace
          </button>
        </div>
      </aside>
    </>
  );
}
