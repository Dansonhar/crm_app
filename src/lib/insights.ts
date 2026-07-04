import type { Client, Invoice, Lead, LeadStage, Project, Task } from '@/types';
import { formatCurrency, formatShortDate } from '@/lib/utils';

// The insight engine turns the live CRM data into plain-language answers.
// It's fully deterministic (no external API), so the dashboard bot always works
// offline and on GitHub Pages — every figure is computed from real records.

export type InsightCategory = 'Sales' | 'Revenue' | 'Clients' | 'Projects' | 'Focus';

export interface InsightData {
  clients: Client[];
  leads: Lead[];
  projects: Project[];
  invoices: Invoice[];
  tasks: Task[];
  revenueByMonth: { month: string; revenue: number; expenses: number }[];
}

export interface Insight {
  headline: string;
  bullets: string[];
  tone: 'positive' | 'negative' | 'neutral';
}

export interface QuickQuestion {
  id: string;
  label: string;
  category: InsightCategory;
  keywords: string[];
}

export const insightCategories: InsightCategory[] = ['Sales', 'Revenue', 'Clients', 'Projects', 'Focus'];

export const quickQuestions: QuickQuestion[] = [
  { id: 'sales-pipeline', label: "How's my sales pipeline?", category: 'Sales', keywords: ['pipeline', 'sales overview', 'how are sales', 'deals'] },
  { id: 'sales-top-deals', label: 'What are my biggest deals?', category: 'Sales', keywords: ['biggest deal', 'top deal', 'largest deal', 'best opportunit'] },
  { id: 'sales-win-rate', label: "What's my win rate?", category: 'Sales', keywords: ['win rate', 'won', 'conversion rate', 'close rate'] },
  { id: 'sales-attention', label: 'Which deals need attention?', category: 'Sales', keywords: ['need attention', 'stale deal', 'follow up', 'follow-up', 'chase'] },

  { id: 'revenue-trend', label: 'How is revenue trending?', category: 'Revenue', keywords: ['revenue', 'income', 'trend', 'growth', 'profit', 'margin'] },
  { id: 'revenue-outstanding', label: "What's outstanding on invoices?", category: 'Revenue', keywords: ['outstanding', 'unpaid', 'overdue invoice', 'receivable', 'owed'] },
  { id: 'revenue-top-payers', label: 'Who owes me the most?', category: 'Revenue', keywords: ['who owes', 'owes me', 'debtor', 'biggest invoice'] },

  { id: 'clients-overview', label: 'Give me a client overview', category: 'Clients', keywords: ['client overview', 'how many client', 'clients'] },
  { id: 'clients-at-risk', label: 'Which clients are going quiet?', category: 'Clients', keywords: ['going quiet', 'at risk client', 'not contacted', 'churn', 'quiet'] },
  { id: 'clients-top', label: 'Who are my top clients?', category: 'Clients', keywords: ['top client', 'best client', 'most valuable', 'biggest client'] },

  { id: 'projects-health', label: 'How are my projects doing?', category: 'Projects', keywords: ['project', 'delivery', 'how are project', 'project health'] },
  { id: 'projects-risk', label: 'Which projects are at risk?', category: 'Projects', keywords: ['project at risk', 'delayed', 'behind', 'risky project'] },
  { id: 'projects-deadlines', label: 'What deadlines are coming up?', category: 'Projects', keywords: ['deadline', 'due soon', 'upcoming', 'coming up'] },

  { id: 'focus-today', label: 'What should I focus on today?', category: 'Focus', keywords: ['focus', 'today', 'priorit', 'to do', 'todo', 'task'] },
  { id: 'focus-summary', label: 'Give me an executive summary', category: 'Focus', keywords: ['summary', 'executive', 'everything', 'snapshot', 'overview'] },
];

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

// Probability of closing, by pipeline stage — used to weight the forecast.
const STAGE_PROBABILITY: Partial<Record<LeadStage, number>> = {
  new: 0.1,
  contacted: 0.25,
  proposal: 0.5,
  negotiation: 0.75,
};

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function daysUntilDate(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function pct(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function relativeDeadline(iso: string) {
  const d = daysUntilDate(iso);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'due today';
  if (d === 1) return 'due tomorrow';
  return `in ${d}d`;
}

function activeDeals(leads: Lead[]) {
  return leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost');
}

export function computeInsight(id: string, data: InsightData): Insight {
  const { clients, leads, projects, invoices, tasks, revenueByMonth } = data;

  switch (id) {
    case 'sales-pipeline': {
      const active = activeDeals(leads);
      const total = active.reduce((s, l) => s + l.dealValue, 0);
      const weighted = active.reduce((s, l) => s + l.dealValue * (STAGE_PROBABILITY[l.stage] ?? 0), 0);
      const stages: LeadStage[] = ['new', 'contacted', 'proposal', 'negotiation'];
      const bullets = stages
        .map((st) => {
          const inStage = active.filter((l) => l.stage === st);
          if (inStage.length === 0) return null;
          const val = inStage.reduce((s, l) => s + l.dealValue, 0);
          return `${STAGE_LABELS[st]}: ${inStage.length} deal${inStage.length > 1 ? 's' : ''} · ${formatCurrency(val)}`;
        })
        .filter((x): x is string => x !== null);
      bullets.push(`Weighted forecast (probability-adjusted): ${formatCurrency(Math.round(weighted))}`);
      const highPriority = active.filter((l) => l.priority === 'high').length;
      if (highPriority > 0) bullets.push(`${highPriority} high-priority deal${highPriority > 1 ? 's' : ''} to prioritise`);
      return {
        headline:
          active.length === 0
            ? 'Your pipeline is empty right now — time to add some leads.'
            : `You have ${active.length} active deals worth ${formatCurrency(total)} in the pipeline.`,
        bullets,
        tone: active.length === 0 ? 'neutral' : 'positive',
      };
    }

    case 'sales-top-deals': {
      const top = [...activeDeals(leads)].sort((a, b) => b.dealValue - a.dealValue).slice(0, 3);
      return {
        headline: top.length ? 'Your biggest open opportunities right now:' : 'No open deals to rank yet.',
        bullets: top.map(
          (l) => `${l.clientName} · ${l.company} — ${formatCurrency(l.dealValue)} · ${STAGE_LABELS[l.stage]} · ${l.priority} priority`,
        ),
        tone: top.length ? 'positive' : 'neutral',
      };
    }

    case 'sales-win-rate': {
      const won = leads.filter((l) => l.stage === 'won');
      const lost = leads.filter((l) => l.stage === 'lost');
      const decided = won.length + lost.length;
      const rate = pct(won.length, decided);
      const wonValue = won.reduce((s, l) => s + l.dealValue, 0);
      const lostValue = lost.reduce((s, l) => s + l.dealValue, 0);
      return {
        headline:
          decided === 0
            ? 'No closed deals yet, so there’s no win rate to report.'
            : `Your win rate is ${rate}% — ${won.length} won vs ${lost.length} lost.`,
        bullets:
          decided === 0
            ? ['Close a few deals and this will start tracking automatically.']
            : [
                `Revenue won: ${formatCurrency(wonValue)}`,
                `Value lost: ${formatCurrency(lostValue)}`,
                rate >= 50 ? 'You’re converting more than half of decided deals — solid.' : 'Under 50% — worth reviewing where deals stall.',
              ],
        tone: decided === 0 ? 'neutral' : rate >= 50 ? 'positive' : 'negative',
      };
    }

    case 'sales-attention': {
      const active = activeDeals(leads);
      const overdue = active
        .filter((l) => daysUntilDate(l.nextFollowUp) < 0)
        .sort((a, b) => new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime());
      const highPriority = active.filter((l) => l.priority === 'high');
      const bullets: string[] = [];
      overdue.slice(0, 3).forEach((l) => bullets.push(`${l.clientName} (${l.company}) — follow-up ${relativeDeadline(l.nextFollowUp)}`));
      if (highPriority.length > 0) bullets.push(`${highPriority.length} high-priority deal${highPriority.length > 1 ? 's' : ''} in play`);
      if (bullets.length === 0) bullets.push('Nothing overdue — every active deal has a fresh follow-up date. 👍');
      return {
        headline:
          overdue.length > 0
            ? `${overdue.length} deal${overdue.length > 1 ? 's have' : ' has'} an overdue follow-up.`
            : 'Your pipeline follow-ups are all on schedule.',
        bullets,
        tone: overdue.length > 0 ? 'negative' : 'positive',
      };
    }

    case 'revenue-trend': {
      if (revenueByMonth.length < 2) {
        return { headline: 'Not enough revenue history yet to spot a trend.', bullets: [], tone: 'neutral' };
      }
      const last = revenueByMonth[revenueByMonth.length - 1];
      const prev = revenueByMonth[revenueByMonth.length - 2];
      const change = prev.revenue === 0 ? 0 : ((last.revenue - prev.revenue) / prev.revenue) * 100;
      const profit = last.revenue - last.expenses;
      const margin = pct(profit, last.revenue);
      const best = [...revenueByMonth].sort((a, b) => b.revenue - a.revenue)[0];
      const avg = Math.round(revenueByMonth.reduce((s, m) => s + m.revenue, 0) / revenueByMonth.length);
      return {
        headline: `${last.month} revenue is ${formatCurrency(last.revenue)} — ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% vs ${prev.month}.`,
        bullets: [
          `Net profit this month: ${formatCurrency(profit)} (${margin}% margin)`,
          `Best month so far: ${best.month} at ${formatCurrency(best.revenue)}`,
          `Monthly average: ${formatCurrency(avg)}`,
        ],
        tone: change >= 0 ? 'positive' : 'negative',
      };
    }

    case 'revenue-outstanding': {
      const unpaid = invoices.filter((i) => i.status !== 'paid');
      const overdue = invoices.filter((i) => i.status === 'overdue');
      const pending = invoices.filter((i) => i.status === 'pending');
      const totalUnpaid = unpaid.reduce((s, i) => s + i.amount, 0);
      const overdueTotal = overdue.reduce((s, i) => s + i.amount, 0);
      const pendingTotal = pending.reduce((s, i) => s + i.amount, 0);
      const bullets: string[] = [];
      if (overdue.length > 0) bullets.push(`⚠️ ${overdue.length} overdue · ${formatCurrency(overdueTotal)} — chase these first`);
      if (pending.length > 0) bullets.push(`${pending.length} pending · ${formatCurrency(pendingTotal)}`);
      if (bullets.length === 0) bullets.push('Every invoice is paid — nothing outstanding. 🎉');
      return {
        headline:
          totalUnpaid === 0
            ? 'You have no outstanding invoices.'
            : `${formatCurrency(totalUnpaid)} is outstanding across ${unpaid.length} invoice${unpaid.length > 1 ? 's' : ''}.`,
        bullets,
        tone: overdue.length > 0 ? 'negative' : totalUnpaid === 0 ? 'positive' : 'neutral',
      };
    }

    case 'revenue-top-payers': {
      const unpaid = invoices.filter((i) => i.status !== 'paid');
      const byClient = new Map<string, { amount: number; count: number }>();
      unpaid.forEach((i) => {
        const cur = byClient.get(i.clientName) ?? { amount: 0, count: 0 };
        byClient.set(i.clientName, { amount: cur.amount + i.amount, count: cur.count + 1 });
      });
      const ranked = [...byClient.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 3);
      return {
        headline: ranked.length ? 'Clients with the largest outstanding balances:' : 'No unpaid invoices — nobody owes you right now.',
        bullets: ranked.map(([name, v]) => `${name} — ${formatCurrency(v.amount)} across ${v.count} invoice${v.count > 1 ? 's' : ''}`),
        tone: ranked.length ? 'neutral' : 'positive',
      };
    }

    case 'clients-overview': {
      const active = clients.filter((c) => c.status === 'active');
      const leadStatus = clients.filter((c) => c.status === 'lead');
      const inactive = clients.filter((c) => c.status === 'inactive');
      const industryCounts = new Map<string, number>();
      clients.forEach((c) => industryCounts.set(c.industry, (industryCounts.get(c.industry) ?? 0) + 1));
      const topIndustries = [...industryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      const recent = clients.filter((c) => daysSince(c.createdAt) <= 30).length;
      return {
        headline: `You're managing ${clients.length} client${clients.length > 1 ? 's' : ''} — ${active.length} active.`,
        bullets: [
          `Status: ${active.length} active · ${leadStatus.length} leads · ${inactive.length} inactive`,
          topIndustries.length ? `Top industries: ${topIndustries.map(([n, c]) => `${n} (${c})`).join(', ')}` : '',
          `${recent} added in the last 30 days`,
        ].filter(Boolean),
        tone: 'neutral',
      };
    }

    case 'clients-at-risk': {
      const quiet = clients
        .filter((c) => c.status === 'active' && daysSince(c.lastContacted) >= 21)
        .sort((a, b) => new Date(a.lastContacted).getTime() - new Date(b.lastContacted).getTime());
      return {
        headline:
          quiet.length === 0
            ? 'No active client has gone quiet — you’re staying in touch well.'
            : `${quiet.length} active client${quiet.length > 1 ? 's have' : ' has'} gone quiet (21+ days).`,
        bullets:
          quiet.length === 0
            ? ['Everyone’s been contacted within the last three weeks.']
            : quiet.slice(0, 4).map((c) => `${c.name} (${c.company}) — last contact ${daysSince(c.lastContacted)}d ago`),
        tone: quiet.length === 0 ? 'positive' : 'negative',
      };
    }

    case 'clients-top': {
      const byClient = new Map<string, number>();
      invoices.forEach((i) => byClient.set(i.clientName, (byClient.get(i.clientName) ?? 0) + i.amount));
      const ranked = [...byClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      return {
        headline: ranked.length ? 'Your highest-billing clients:' : 'No billing history yet to rank clients.',
        bullets: ranked.map(([name, amount], i) => `${i + 1}. ${name} — ${formatCurrency(amount)} invoiced`),
        tone: ranked.length ? 'positive' : 'neutral',
      };
    }

    case 'projects-health': {
      const active = projects.filter((p) => p.status !== 'completed');
      const completed = projects.filter((p) => p.status === 'completed');
      const onTrack = active.filter((p) => p.status === 'on-track').length;
      const atRisk = active.filter((p) => p.status === 'at-risk').length;
      const delayed = active.filter((p) => p.status === 'delayed').length;
      const avgProgress = active.length ? Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length) : 0;
      const activeBudget = active.reduce((s, p) => s + p.budget, 0);
      return {
        headline: `${active.length} active project${active.length > 1 ? 's' : ''}, ${completed.length} completed.`,
        bullets: [
          `Health: ${onTrack} on-track · ${atRisk} at-risk · ${delayed} delayed`,
          `Average progress: ${avgProgress}%`,
          `Active project budget: ${formatCurrency(activeBudget)}`,
        ],
        tone: delayed + atRisk > onTrack ? 'negative' : 'positive',
      };
    }

    case 'projects-risk': {
      const risky = projects
        .filter((p) => p.status === 'at-risk' || p.status === 'delayed')
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      return {
        headline:
          risky.length === 0 ? 'No projects are flagged at-risk or delayed. 🎉' : `${risky.length} project${risky.length > 1 ? 's need' : ' needs'} attention.`,
        bullets:
          risky.length === 0
            ? ['Everything is currently on-track or completed.']
            : risky.slice(0, 4).map((p) => `${p.name} (${p.clientName}) — ${p.status}, ${p.progress}% done, ${relativeDeadline(p.deadline)}`),
        tone: risky.length === 0 ? 'positive' : 'negative',
      };
    }

    case 'projects-deadlines': {
      const upcoming = projects
        .filter((p) => p.status !== 'completed')
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 4);
      return {
        headline: upcoming.length ? 'Next project deadlines on the horizon:' : 'No open project deadlines right now.',
        bullets: upcoming.map((p) => `${p.name} (${p.clientName}) — ${formatShortDate(p.deadline)} · ${relativeDeadline(p.deadline)}`),
        tone: upcoming.some((p) => daysUntilDate(p.deadline) < 0) ? 'negative' : 'neutral',
      };
    }

    case 'focus-today': {
      const pending = tasks.filter((t) => t.status === 'pending');
      const overdue = pending.filter((t) => daysUntilDate(t.dueDate) < 0);
      const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const ordered = [...pending].sort((a, b) => {
        const ao = daysUntilDate(a.dueDate) < 0 ? 0 : 1;
        const bo = daysUntilDate(b.dueDate) < 0 ? 0 : 1;
        if (ao !== bo) return ao - bo;
        if (priorityRank[a.priority] !== priorityRank[b.priority]) return priorityRank[a.priority] - priorityRank[b.priority];
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      const bullets = ordered.slice(0, 4).map((t) => `${t.title}${t.clientName ? ` · ${t.clientName}` : ''} — ${relativeDeadline(t.dueDate)} · ${t.priority}`);
      if (bullets.length === 0) bullets.push('No open tasks — you’re all caught up! ✅');
      return {
        headline:
          pending.length === 0
            ? 'Nothing on your task list — enjoy the clear runway.'
            : `You have ${pending.length} open task${pending.length > 1 ? 's' : ''}${overdue.length ? `, ${overdue.length} overdue` : ''}.`,
        bullets,
        tone: overdue.length > 0 ? 'negative' : 'neutral',
      };
    }

    case 'focus-summary': {
      const active = activeDeals(leads);
      const pipelineValue = active.reduce((s, l) => s + l.dealValue, 0);
      const activeProjects = projects.filter((p) => p.status !== 'completed').length;
      const unpaid = invoices.filter((i) => i.status !== 'paid');
      const outstanding = unpaid.reduce((s, i) => s + i.amount, 0);
      const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
      const last = revenueByMonth[revenueByMonth.length - 1];
      const prev = revenueByMonth[revenueByMonth.length - 2];
      const change = prev && prev.revenue ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : 0;
      return {
        headline: 'Here’s your agency at a glance:',
        bullets: [
          `👥 ${clients.length} clients · ${activeProjects} active projects`,
          `💼 ${active.length} open deals worth ${formatCurrency(pipelineValue)}`,
          `💵 ${last.month} revenue ${formatCurrency(last.revenue)} (${change >= 0 ? '+' : ''}${change.toFixed(1)}% vs ${prev?.month ?? '—'})`,
          `🧾 ${formatCurrency(outstanding)} outstanding · ${pendingTasks} open tasks`,
        ],
        tone: change >= 0 ? 'positive' : 'negative',
      };
    }

    default:
      return {
        headline: 'I can help with sales, revenue, clients, projects, and your daily focus.',
        bullets: ['Pick a topic below, or try asking things like “how’s my pipeline?” or “who owes me money?”'],
        tone: 'neutral',
      };
  }
}

// Best-effort match of free-text input to a known question.
export function matchQuestion(text: string): string | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  for (const q of quickQuestions) {
    if (q.keywords.some((k) => t.includes(k))) return q.id;
    if (t.includes(q.label.toLowerCase().replace(/[?"']/g, ''))) return q.id;
  }
  return null;
}
