import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface GreetingBannerProps {
  name?: string;
  audience: 'patient' | 'doctor';
  stat?: { label: string; value: string | number };
  action?: React.ReactNode;
}

function getTimeSlot(hour: number): 'Morning' | 'Afternoon' | 'Evening' | 'Night' {
  if (hour < 5) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  if (hour < 22) return 'Evening';
  return 'Night';
}

export function GreetingBanner({ name, audience, stat, action }: GreetingBannerProps) {
  const { t, i18n } = useTranslation();

  const { greeting, dateLabel } = useMemo(() => {
    const now = new Date();
    const slot = getTimeSlot(now.getHours());
    const greetingKey = `${audience}.home.greeting${slot}`;
    const dateLabel = new Intl.DateTimeFormat(i18n.language, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now);
    return { greeting: t(greetingKey), dateLabel };
  }, [audience, t, i18n.language]);

  const displayName = (name ?? '').split(' ')[0] ?? '';
  const subtitle = t(`${audience}.home.welcomeSubtitle`);

  return (
    <section
      aria-label={greeting}
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-card to-card p-5 shadow-sm md:p-6"
    >
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-10 size-44 rounded-full bg-accent/30 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <CalendarIcon className="size-3.5" aria-hidden="true" />
            <time>{dateLabel}</time>
          </div>
          <h2 className="flex flex-wrap items-center gap-2 font-semibold text-foreground text-xl leading-tight tracking-tight md:text-2xl">
            <span>
              {greeting}
              {displayName ? `, ${displayName}` : ''}
            </span>
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
          </h2>
          <p className="max-w-xl text-muted-foreground text-sm">{subtitle}</p>
        </div>

        {(stat || action) && (
          <div className="flex flex-wrap items-center gap-3">
            {stat && (
              <div className="rounded-xl border bg-background/60 px-4 py-2.5 backdrop-blur">
                <p className="font-semibold text-2xl tabular-nums leading-none">{stat.value}</p>
                <p className="mt-0.5 text-muted-foreground text-xs">{stat.label}</p>
              </div>
            )}
            {action && <div className="flex items-center gap-2">{action}</div>}
          </div>
        )}
      </div>
    </section>
  );
}
