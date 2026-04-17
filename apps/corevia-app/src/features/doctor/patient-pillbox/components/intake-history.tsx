import { CheckCircle2, Circle, Clock, Pill, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type HistoryIntake = {
  id: string;
  patientMedicationId: string;
  scheduledTime: string;
  status: string;
  takenAt: Date | string | null;
  notes: string | null;
  medicationName: string;
  medicationForm: string | null;
  dosageLabel: string | null;
  quantity: string | null;
  unit: string | null;
  intakeMoment: string | null;
};

export type HistoryDay = {
  date: string;
  allTaken: boolean | null;
  totalCount: number;
  takenCount: number;
  intakes: HistoryIntake[];
};

interface Props {
  days: HistoryDay[] | undefined;
  isLoading: boolean;
  rangeDays: number;
  onRangeChange: (n: number) => void;
}

const RANGES = [7, 14, 30];

function parseYMD(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDay(iso: string, locale: string): string {
  const d = parseYMD(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

function shortWeekday(iso: string, locale: string): string {
  const d = parseYMD(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
}

const statusTone: Record<
  string,
  { icon: typeof CheckCircle2; iconClass: string; badgeClass: string }
> = {
  TAKEN: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-500',
    badgeClass: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  },
  SKIPPED: {
    icon: XCircle,
    iconClass: 'text-destructive',
    badgeClass: 'bg-destructive/10 text-destructive',
  },
  PENDING: {
    icon: Circle,
    iconClass: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground',
  },
};

export function IntakeHistory({ days, isLoading, rangeDays, onRangeChange }: Props) {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (!days) return { taken: 0, missed: 0, empty: 0, adherence: 0 };
    const taken = days.filter(d => d.allTaken === true).length;
    const missed = days.filter(d => d.allTaken === false).length;
    const empty = days.filter(d => d.allTaken === null).length;
    const withData = taken + missed;
    const adherence = withData > 0 ? Math.round((taken / withData) * 100) : 0;
    return { taken, missed, empty, adherence };
  }, [days]);

  const selectedDay = useMemo(() => {
    if (!days || !selectedDate) return null;
    return days.find(d => d.date === selectedDate) ?? null;
  }, [days, selectedDate]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-sm">
                {t('doctor.patientPillbox.historyTitle', { defaultValue: 'Adherence history' })}
              </h3>
              <p className="text-muted-foreground text-xs">
                {t('doctor.patientPillbox.historySubtitle', {
                  defaultValue: 'Last {{n}} days · tap a day for details',
                  n: rangeDays,
                })}
              </p>
            </div>
            <div
              role="tablist"
              aria-label={t('doctor.patientPillbox.historyRange', {
                defaultValue: 'History range',
              })}
              className="inline-flex rounded-lg bg-muted p-0.5 text-xs"
            >
              {RANGES.map(n => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={n === rangeDays}
                  onClick={() => {
                    onRangeChange(n);
                    setSelectedDate(null);
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-medium transition-colors',
                    n === rangeDays
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-16 w-full rounded-md" />
          ) : !days || days.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">
              {t('doctor.patientPillbox.historyEmpty', {
                defaultValue: 'No intake data for this range.',
              })}
            </p>
          ) : (
            <>
              {/** biome-ignore lint/a11y/useSemanticElements: pass */}
              <div
                role="group"
                aria-label={t('doctor.patientPillbox.historyLabel', {
                  defaultValue: 'Daily adherence',
                })}
                className="flex gap-1 overflow-x-auto pb-1"
              >
                {days.map(d => {
                  const active = d.date === selectedDate;
                  const hasData = d.totalCount > 0;
                  const tone =
                    d.allTaken === true
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : d.allTaken === false
                        ? 'bg-destructive hover:bg-destructive/90'
                        : 'bg-muted hover:bg-muted-foreground/25';
                  const status =
                    d.allTaken === true
                      ? t('doctor.patientPillbox.historyTaken', { defaultValue: 'All taken' })
                      : d.allTaken === false
                        ? t('doctor.patientPillbox.historyMissed', {
                            defaultValue: 'Missed / pending',
                          })
                        : t('doctor.patientPillbox.historyNone', { defaultValue: 'No intakes' });
                  return (
                    <button
                      key={d.date}
                      type="button"
                      aria-label={`${formatDay(d.date, i18n.language)}: ${status}`}
                      aria-pressed={active}
                      disabled={!hasData}
                      onClick={() => setSelectedDate(active ? null : d.date)}
                      className={cn(
                        'flex min-w-[32px] flex-1 flex-col items-center gap-1 rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active && 'bg-accent',
                        !hasData && 'cursor-not-allowed opacity-70',
                      )}
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {shortWeekday(d.date, i18n.language).slice(0, 2)}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-6 w-full rounded-sm transition-all',
                          tone,
                          active && 'ring-2 ring-ring ring-offset-1',
                        )}
                      />
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {d.date.slice(8, 10)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <dl className="grid grid-cols-3 gap-3 border-t pt-3">
                <div>
                  <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t('doctor.patientPillbox.adherence', { defaultValue: 'Adherence' })}
                  </dt>
                  <dd className="font-semibold text-lg tabular-nums">{summary.adherence}%</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t('doctor.patientPillbox.historyTaken', { defaultValue: 'All taken' })}
                  </dt>
                  <dd className="font-semibold text-lg tabular-nums">{summary.taken}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t('doctor.patientPillbox.historyMissed', { defaultValue: 'Missed' })}
                  </dt>
                  <dd className="font-semibold text-destructive text-lg tabular-nums">
                    {summary.missed}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      {selectedDay && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                  {t('doctor.patientPillbox.dayDetail', { defaultValue: 'Day detail' })}
                </p>
                <h4 className="font-semibold text-sm capitalize">
                  {formatDay(selectedDay.date, i18n.language)}
                </h4>
              </div>
              <p className="text-muted-foreground text-xs tabular-nums">
                {t('doctor.patientPillbox.takenOfTotal', {
                  defaultValue: '{{taken}} / {{total}} taken',
                  taken: selectedDay.takenCount,
                  total: selectedDay.totalCount,
                })}
              </p>
            </div>

            {selectedDay.intakes.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                {t('doctor.patientPillbox.historyNone', { defaultValue: 'No intakes' })}
              </p>
            ) : (
              <ul className="space-y-2">
                {[...selectedDay.intakes]
                  .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                  .map(intake => {
                    const status = intake.status.toUpperCase();
                    const tone = statusTone[status] ?? statusTone.PENDING;
                    const StatusIcon = tone.icon;
                    const takenAt =
                      intake.takenAt &&
                      new Date(intake.takenAt).toLocaleTimeString(i18n.language, {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    return (
                      <li
                        key={intake.id}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                      >
                        <div
                          aria-hidden="true"
                          className="flex w-14 shrink-0 flex-col items-center gap-0.5 border-r pr-3 text-center"
                        >
                          <Clock className="size-3.5 text-primary" />
                          <span className="font-semibold text-[13px] tabular-nums">
                            {intake.scheduledTime?.slice(0, 5) || '—'}
                          </span>
                        </div>
                        <Pill className="size-5 shrink-0 text-primary" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-sm">{intake.medicationName}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground text-xs">
                            {intake.dosageLabel && <span>{intake.dosageLabel}</span>}
                            {intake.quantity && (
                              <span className="tabular-nums">
                                {intake.quantity}
                                {intake.unit ? ` ${intake.unit}` : ''}
                              </span>
                            )}
                            {intake.intakeMoment && (
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                                {intake.intakeMoment}
                              </span>
                            )}
                            {status === 'TAKEN' && takenAt && (
                              <span className="tabular-nums">
                                {t('doctor.patientPillbox.takenAt', {
                                  defaultValue: 'at {{t}}',
                                  t: takenAt,
                                })}
                              </span>
                            )}
                          </p>
                          {intake.notes && (
                            <p className="mt-1 line-clamp-2 text-muted-foreground text-xs italic">
                              {intake.notes}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={cn(
                            'shrink-0 gap-1 border-transparent font-medium',
                            tone.badgeClass,
                          )}
                        >
                          <StatusIcon
                            className={cn('size-3.5', tone.iconClass)}
                            aria-hidden="true"
                          />
                          {status}
                        </Badge>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
