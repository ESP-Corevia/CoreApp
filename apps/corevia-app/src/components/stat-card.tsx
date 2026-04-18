import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'primary' | 'accent' | 'warning' | 'muted';
  hint?: string;
  to?: string;
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'text-primary bg-primary/10',
  accent: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-300',
  warning: 'text-amber-700 bg-amber-500/10 dark:text-amber-300',
  muted: 'text-muted-foreground bg-muted',
};

export function StatCard({ label, value, icon: Icon, tone = 'primary', hint, to }: StatCardProps) {
  const content = (
    <>
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          toneStyles[tone],
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-2xl tabular-nums leading-none">{value}</p>
        <p className="mt-1 truncate text-muted-foreground text-xs">{label}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{hint}</p>}
      </div>
    </>
  );

  const baseClasses =
    'flex items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-all duration-150';

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          baseClasses,
          'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
