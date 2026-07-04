import { useEffect, useState } from 'react';
import {
  Users,
  FolderKanban,
  Receipt,
  Banknote,
  Phone,
  Mail,
  Calendar,
  StickyNote,
  Handshake,
  CheckCircle2,
  Send,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { InsightBot } from '@/components/dashboard/InsightBot';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge } from '@/components/ui/Badge';
import { revenueByMonth } from '@/data/mockData';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatShortDate, timeAgo } from '@/lib/utils';
import { notifyTeam, formatSummaryAlert } from '@/lib/telegram';
import type { ActivityType, LeadStage } from '@/types';

const SUMMARY_STORAGE_KEY = 'agencyflow-last-summary-date';

// Demo trend figures shown on the stat cards — reused here so the Telegram
// summary always matches what the owner sees on screen.
const CLIENTS_TREND = 8.2;
const PROJECTS_TREND = 4.6;
const INVOICES_TREND = -3.1;
const REVENUE_TREND = 17.3;

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

const activityStyles: Record<ActivityType, string> = {
  call: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  email: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  meeting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  note: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  invoice: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  project: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  deal: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  message: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

const leadStageLabels: { stage: LeadStage; label: string }[] = [
  { stage: 'new', label: 'New' },
  { stage: 'contacted', label: 'Contacted' },
  { stage: 'proposal', label: 'Proposal' },
  { stage: 'negotiation', label: 'Negotiation' },
  { stage: 'won', label: 'Won' },
];

export function Dashboard() {
  const { clients, projects, invoices, tasks, leads, activities } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [sendingSummary, setSendingSummary] = useState(false);
  const activeProjects = projects.filter((p) => p.status !== 'completed').length;
  const pendingInvoices = invoices.filter((i) => i.status !== 'paid').length;
  const monthlyRevenue = revenueByMonth[revenueByMonth.length - 1].revenue;
  const upcomingTasks = tasks
    .filter((t) => t.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);
  const leadConversion = leadStageLabels.map(({ stage, label }) => ({
    stage: label,
    value: leads.filter((l) => l.stage === stage).length,
  }));
  const recentActivities = activities.slice(0, 10);

  const activeDeals = leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost');
  const pipelineValue = activeDeals.reduce((sum, l) => sum + l.dealValue, 0);
  const wonDeals = leads.filter((l) => l.stage === 'won');
  const lostDeals = leads.filter((l) => l.stage === 'lost');

  function buildExecutiveSummary() {
    const outlook =
      REVENUE_TREND >= 0
        ? `📈 Revenue is trending up ${REVENUE_TREND}% vs last month — performance looks healthy.`
        : `📉 Revenue is down ${Math.abs(REVENUE_TREND)}% vs last month — worth reviewing the pipeline.`;
    const focusLines =
      REVENUE_TREND >= 0
        ? ['Maintain the current sales cadence', 'Keep nurturing active pipeline deals']
        : ['Review pipeline conversion bottlenecks', 'Prioritize outreach on high-value active deals'];

    return formatSummaryAlert(
      new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      [
        {
          heading: '🏢 Business Snapshot',
          lines: [
            `👥 Total Clients: ${clients.length} (${CLIENTS_TREND >= 0 ? '+' : ''}${CLIENTS_TREND}% vs last month)`,
            `📁 Active Projects: ${activeProjects} (${PROJECTS_TREND >= 0 ? '+' : ''}${PROJECTS_TREND}% vs last month)`,
            `🧾 Pending Invoices: ${pendingInvoices} (${INVOICES_TREND >= 0 ? '+' : ''}${INVOICES_TREND}% vs last month)`,
            `💵 Monthly Revenue: ${formatCurrency(monthlyRevenue)} (${REVENUE_TREND >= 0 ? '+' : ''}${REVENUE_TREND}% vs last month)`,
          ],
        },
        {
          heading: '💼 Sales Pipeline',
          lines: [
            `🎯 Active Deals: ${activeDeals.length} worth ${formatCurrency(pipelineValue)}`,
            `✅ Deals Won (Total): ${wonDeals.length}`,
            `❌ Deals Lost (Total): ${lostDeals.length}`,
          ],
        },
        {
          heading: '🔭 Outlook',
          lines: [outlook],
        },
        {
          heading: '🎯 Recommended Focus',
          lines: focusLines.map((l) => `• ${l}`),
        },
      ],
    );
  }

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(SUMMARY_STORAGE_KEY) === today) return;
    localStorage.setItem(SUMMARY_STORAGE_KEY, today);
    notifyTeam(buildExecutiveSummary()).catch((err) => {
      console.warn('Executive summary notification failed:', err instanceof Error ? err.message : err);
    });
    // Intentionally run once per mount/day — buildExecutiveSummary reads current values by closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSendSummary() {
    setSendingSummary(true);
    try {
      await notifyTeam(buildExecutiveSummary());
      localStorage.setItem(SUMMARY_STORAGE_KEY, new Date().toISOString().slice(0, 10));
      showToast('Executive summary queued for Telegram — check the chat in a few seconds.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send summary.', 'error');
    } finally {
      setSendingSummary(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {currentUser?.name.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here's what's happening across your agency today.
          </p>
        </div>
        <button
          onClick={handleSendSummary}
          disabled={sendingSummary}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <Send className="size-4" /> {sendingSummary ? 'Sending…' : 'Send Executive Summary'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Clients"
          value={String(clients.length)}
          icon={Users}
          trend={CLIENTS_TREND}
          trendLabel="vs last month"
        />
        <StatCard
          label="Active Projects"
          value={String(activeProjects)}
          icon={FolderKanban}
          trend={PROJECTS_TREND}
          trendLabel="vs last month"
          iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="Pending Invoices"
          value={String(pendingInvoices)}
          icon={Receipt}
          trend={INVOICES_TREND}
          trendLabel="vs last month"
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          icon={Banknote}
          trend={REVENUE_TREND}
          trendLabel="vs last month"
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <InsightBot />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" /> Expenses
              </span>
            </div>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueByMonth} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5a6cf7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#5a6cf7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  dy={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(v) => `RM${v / 1000}k`}
                  width={44}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'var(--tooltip-bg, #fff)',
                    fontSize: 13,
                  }}
                />
                <Area type="monotone" dataKey="expenses" stroke="#cbd5e1" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="revenue" stroke="#5a6cf7" strokeWidth={2.5} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leadConversion} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgba(148,163,184,0.2)', fontSize: 13 }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#5a6cf7" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <Link to="/tasks" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {recentActivities.map((activity) => {
                const Icon = activityIcons[activity.type];
                return (
                  <li
                    key={activity.id}
                    className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                  >
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${activityStyles[activity.type]}`}>
                      <Icon className="size-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{activity.description}</p>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{timeAgo(activity.timestamp)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Follow-ups</CardTitle>
            <Link to="/tasks" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3">
                  <Avatar name={task.clientName ?? task.title} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{task.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatShortDate(task.dueDate)}</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                </li>
              ))}
              {upcomingTasks.length === 0 && (
                <li className="flex items-center gap-2 py-4 text-sm text-slate-400">
                  <CheckCircle2 className="size-4" /> All caught up!
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
