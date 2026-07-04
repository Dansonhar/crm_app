import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  iconClass,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  iconClass?: string;
}) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <Card className="p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        </div>
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-xl',
            iconClass ?? 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-md px-1.5 py-0.5',
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            )}
          >
            {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-slate-400 dark:text-slate-500">{trendLabel}</span>
        </div>
      )}
    </Card>
  );
}
