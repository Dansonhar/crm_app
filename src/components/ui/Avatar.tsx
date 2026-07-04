import { cn, initials } from '@/lib/utils';

export function Avatar({
  name,
  color = 'bg-brand-500',
  size = 'md',
  className,
}: {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'size-7 text-[11px]',
    md: 'size-9 text-xs',
    lg: 'size-14 text-lg',
  };
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white dark:ring-surface-900',
        sizes[size],
        color,
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
