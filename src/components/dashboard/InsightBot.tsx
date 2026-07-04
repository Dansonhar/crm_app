import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { revenueByMonth } from '@/data/mockData';
import { useData } from '@/context/DataContext';
import {
  computeInsight,
  insightCategories,
  matchQuestion,
  quickQuestions,
  type Insight,
  type InsightCategory,
} from '@/lib/insights';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text?: string;
  insight?: Insight;
}

const toneStyles: Record<Insight['tone'], { chip: string; Icon: typeof TrendingUp }> = {
  positive: { chip: 'text-emerald-600 dark:text-emerald-400', Icon: TrendingUp },
  negative: { chip: 'text-rose-600 dark:text-rose-400', Icon: TrendingDown },
  neutral: { chip: 'text-slate-500 dark:text-slate-400', Icon: Minus },
};

let msgSeq = 0;
function nextId() {
  msgSeq += 1;
  return `m${Date.now()}-${msgSeq}`;
}

export function InsightBot() {
  const { clients, leads, projects, invoices, tasks } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      insight: {
        headline: 'Hi! I’m your AgencyFlow insights assistant. 👋',
        bullets: ['Choose a topic and a question below, or type your own — I’ll answer using your live CRM data.'],
        tone: 'neutral',
      },
    },
  ]);
  const [activeCategory, setActiveCategory] = useState<InsightCategory>('Sales');
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryQuestions = useMemo(
    () => quickQuestions.filter((q) => q.category === activeCategory),
    [activeCategory],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function ask(questionId: string, userLabel: string) {
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: userLabel }]);
    setThinking(true);
    const data = { clients, leads, projects, invoices, tasks, revenueByMonth };
    timerRef.current = setTimeout(() => {
      const insight = computeInsight(questionId, data);
      setMessages((prev) => [...prev, { id: nextId(), role: 'bot', insight }]);
      setThinking(false);
    }, 550);
  }

  function handleQuick(question: (typeof quickQuestions)[number]) {
    if (thinking) return;
    ask(question.id, question.label);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    const matched = matchQuestion(text);
    ask(matched ?? 'unknown', text);
  }

  return (
    <div className="flex h-[30rem] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white card-shadow dark:border-white/[0.06] dark:bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-white/[0.06] sm:px-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-sm">
          <Sparkles className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            AI Insights
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Live data
            </span>
          </h3>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">Ask about sales, revenue, clients & more</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2 text-sm text-white shadow-sm">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white">
                <Sparkles className="size-3.5" strokeWidth={2} />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-slate-50 px-3.5 py-2.5 dark:bg-white/[0.04]">
                {m.insight && <InsightBubble insight={m.insight} />}
                {m.text && <p className="text-sm text-slate-700 dark:text-slate-200">{m.text}</p>}
              </div>
            </div>
          ),
        )}

        {thinking && (
          <div className="flex gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white">
              <Sparkles className="size-3.5" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-slate-50 px-4 py-3 dark:bg-white/[0.04]">
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions + input */}
      <div className="border-t border-slate-100 px-4 py-3 dark:border-white/[0.06] sm:px-5">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {insightCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors ' +
                (cat === activeCategory
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1]')
              }
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {categoryQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => handleQuick(q)}
              disabled={thinking}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
            >
              {q.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your business…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100 dark:focus:bg-white/[0.06]"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function InsightBubble({ insight }: { insight: Insight }) {
  const { chip, Icon } = toneStyles[insight.tone];
  return (
    <div className="space-y-1.5">
      <p className="flex items-start gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <Icon className={`mt-0.5 size-3.5 shrink-0 ${chip}`} strokeWidth={2.5} />
        <span>{insight.headline}</span>
      </p>
      {insight.bullets.length > 0 && (
        <ul className="space-y-1 pl-5">
          {insight.bullets.map((b, i) => (
            <li key={i} className="relative text-xs leading-relaxed text-slate-600 before:absolute before:-left-3 before:text-brand-400 before:content-['•'] dark:text-slate-300">
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
