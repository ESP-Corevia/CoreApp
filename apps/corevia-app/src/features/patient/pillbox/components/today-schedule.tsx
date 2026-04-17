import { Check, CircleCheck, Clock, Pill, SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { IntakeActions } from './intake-actions';

interface Intake {
  id: string;
  medicationName?: string;
  medicationForm?: string | null;
  dosageLabel?: string | null;
  scheduledTime?: string;
  intakeMoment?: string | null;
  quantity?: string | null;
  unit?: string | null;
  status?: string;
}

interface TodayScheduleProps {
  intakes: Intake[];
  isLoading: boolean;
  onTake: (id: string) => void;
  onSkip: (id: string) => void;
}

const MOMENT_KEYS = ['MORNING', 'NOON', 'EVENING', 'BEDTIME'] as const;

function formatTime(raw?: string): string {
  if (!raw) return '';
  const match = raw.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : raw;
}

function formatDosage(intake: Intake): string {
  const parts: string[] = [];
  if (intake.quantity && intake.unit) parts.push(`${intake.quantity} ${intake.unit}`);
  else if (intake.quantity) parts.push(intake.quantity);
  if (intake.dosageLabel) parts.push(intake.dosageLabel);
  else if (intake.medicationForm) parts.push(intake.medicationForm);
  return parts.join(' · ');
}

export function TodaySchedule({ intakes, isLoading, onTake, onSkip }: TodayScheduleProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (intakes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CircleCheck
              className="size-7 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          </div>
          <h3 className="font-semibold text-base">{t('patient.pillbox.noSchedule')}</h3>
          <p className="max-w-xs text-muted-foreground text-sm">
            {t('patient.pillbox.noScheduleDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by scheduled time ascending
  const sorted = [...intakes].sort((a, b) => {
    const ta = formatTime(a.scheduledTime) || '99:99';
    const tb = formatTime(b.scheduledTime) || '99:99';
    return ta.localeCompare(tb);
  });

  return (
    <ul className="space-y-2.5">
      {sorted.map(intake => {
        const medName = intake.medicationName || '—';
        const time = formatTime(intake.scheduledTime);
        const moment =
          intake.intakeMoment && (MOMENT_KEYS as readonly string[]).includes(intake.intakeMoment)
            ? t(`patient.pillbox.moment.${intake.intakeMoment}`)
            : '';
        const dosage = formatDosage(intake);
        const status = intake.status ?? 'PENDING';
        const isTaken = status === 'TAKEN';
        const isSkipped = status === 'SKIPPED';

        return (
          <li key={intake.id}>
            <Card
              className={cn(
                'overflow-hidden transition-colors',
                isTaken && 'border-emerald-500/30 bg-emerald-500/5',
                isSkipped && 'bg-muted/30 opacity-75',
              )}
            >
              <CardContent className="flex items-stretch gap-0 p-0">
                <div
                  className={cn(
                    'flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 border-r px-2 py-3 text-center sm:w-20',
                    isTaken
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : isSkipped
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/5 text-primary',
                  )}
                  aria-hidden="true"
                >
                  <Clock className="size-4" />
                  <span className="font-semibold text-sm tabular-nums">{time || '—'}</span>
                  {moment && (
                    <span className="truncate text-[10px] uppercase tracking-wider opacity-70">
                      {moment}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3 p-3 sm:p-4">
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg',
                      isTaken
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : isSkipped
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary',
                    )}
                    aria-hidden="true"
                  >
                    {isTaken ? (
                      <Check className="size-5" />
                    ) : isSkipped ? (
                      <SkipForward className="size-5" />
                    ) : (
                      <Pill className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn('truncate font-medium text-sm', isSkipped && 'line-through')}
                      title={medName}
                    >
                      {medName}
                    </p>
                    {dosage && (
                      <p className="truncate text-muted-foreground text-xs" title={dosage}>
                        {dosage}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <IntakeActions
                      status={status}
                      onTake={() => onTake(intake.id)}
                      onSkip={() => onSkip(intake.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
