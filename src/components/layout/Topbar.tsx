import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  Plus,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
  Users,
  FolderKanban,
  Receipt,
  CheckSquare,
  Phone,
  Mail,
  Calendar,
  StickyNote,
  Handshake,
  Send,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar } from '@/components/ui/Avatar';
import { activities } from '@/data/mockData';
import { timeAgo } from '@/lib/utils';
import type { ActivityType } from '@/types';

const activityIcons: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
  invoice: Receipt,
  project: FolderKanban,
  deal: Handshake,
  message: Send,
};

const newItems = [
  { label: 'New Client', to: '/clients', icon: Users },
  { label: 'New Project', to: '/projects', icon: FolderKanban },
  { label: 'New Invoice', to: '/invoices', icon: Receipt },
  { label: 'New Task', to: '/tasks', icon: CheckSquare },
];

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { logout, currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [search, setSearch] = useState('');

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/clients?q=${encodeURIComponent(search.trim())}`);
  }

  function handleNewItemClick(to: string) {
    setNewMenuOpen(false);
    navigate(to, { state: { openNew: true } });
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-white/[0.06] dark:bg-surface-950/80 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients, projects, invoices..."
          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 placeholder:truncate outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-white/[0.06] dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-surface-900"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative">
          <button
            onClick={() => setNewMenuOpen((o) => !o)}
            className="hidden items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600 sm:flex"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            New
          </button>
          {newMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNewMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-48 animate-fade-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-surface-900">
                {newItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNewItemClick(item.to)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    <item.icon className="size-4" /> {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setHasUnread(false);
            }}
            className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
          >
            <Bell className="size-[18px]" />
            {hasUnread && (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-surface-950" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-80 animate-fade-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-surface-900">
                <div className="flex items-center justify-between px-2.5 py-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</p>
                  <button
                    onClick={() => showToast('All notifications marked as read.', 'info')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {activities.slice(0, 6).map((activity) => {
                    const Icon = activityIcons[activity.type];
                    return (
                      <div key={activity.id} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600 dark:text-slate-300">{activity.description}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ml-1 h-6 w-px bg-slate-200 dark:bg-white/10" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl py-1 pl-1 pr-2 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <Avatar name={currentUser?.name ?? 'You'} color={currentUser?.avatarColor} size="sm" />
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 md:block">
              {currentUser?.name.split(' ')[0] ?? 'You'}
            </span>
            <ChevronDown className="hidden size-3.5 text-slate-400 md:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-52 animate-fade-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-surface-900">
                <div className="px-2.5 py-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser?.name}</p>
                  <p className="text-xs text-slate-400">{currentUser?.role}</p>
                </div>
                <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  <SettingsIcon className="size-4" /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                >
                  <LogOut className="size-4" /> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
