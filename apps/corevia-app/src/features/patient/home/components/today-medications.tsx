import { Check, CircleCheck, Clock, Pill, SkipForward, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Intake {
  id: string;
  patientMedicationId?: string;
  medicationName?: string;
  medicationForm?: string | null;
  dosageLabel?: string | null;
  scheduledTime?: string;
  intakeMoment?: string | null;
  quantity?: string | null;
  unit?: string | null;
  status?: string;
  notes?: string | null;
}

interface TodayMedicationsProps {
  intakes: Intake[];
  onTake: (id: string) => void;
  onSkip: (id: string) => void;
}

const MOMENT_KEYS = ['MORNING', 'NOON', 'EVENING', 'BEDTIME'] as const;

function formatTime(raw?: string): string {
  if (!raw) return '';
  // handle "HH:MM:SS" or "HH:MM"
  const match = raw.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : raw;
}

function formatDosage(intake: Intake): string {
  const parts: string[] = [];
  if (intake.quantity && intake.unit) {
    parts.push(`${intake.quantity} ${intake.unit}`);
  } else if (intake.quantity) {
    parts.push(intake.quantity);
  }
  if (intake.dosageLabel) parts.push(intake.dosageLabel);
  else if (intake.medicationForm) parts.push(intake.medicationForm);
  return parts.join(' · ');
}

export function TodayMedications({ intakes, onTake, onSkip }: TodayMedicationsProps) {
  const { t } = useTranslation();

  if (intakes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <CircleCheck
              className="size-6 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          </div>
          <h3 className="font-semibold text-base">{t('patient.home.noMedications')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('patient.home.noMedicationsDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const takenCount = intakes.filter(i => (i.status ?? 'PENDING') === 'TAKEN').length;
  const total = intakes.length;
  const progressPct = Math.round((takenCount / total) * 100);
  const allDone = takenCount === total;

  // Sort by scheduled time ascending so morning doses come first
  const sorted = [...intakes].sort((a, b) => {
    const ta = formatTime(a.scheduledTime) || '99:99';
    const tb = formatTime(b.scheduledTime) || '99:99';
    return ta.localeCompare(tb);
  });

  return (
    <Card>
      <CardContent className="p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base">{t('patient.home.todaysMedications')}</h3>
            <p className="text-muted-foreground text-sm">
              {allDone
                ? t('patient.home.allTaken')
                : t('patient.home.medicationsProgress', { taken: takenCount, total })}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/patient/pillbox">{t('patient.home.viewAll')}</Link>
          </Button>
        </div>

        <div
          className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('patient.home.medicationsProgress', { taken: takenCount, total })}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              allDone ? 'bg-emerald-500' : 'bg-primary',
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ul className="space-y-2">
          {sorted.map(intake => {
            const medName = intake.medicationName || '—';
            const time = formatTime(intake.scheduledTime);
            const moment =
              intake.intakeMoment &&
              (MOMENT_KEYS as readonly string[]).includes(intake.intakeMoment)
                ? t(`patient.pillbox.moment.${intake.intakeMoment}`)
                : '';
            const dosage = formatDosage(intake);
            const status = intake.status ?? 'PENDING';
            const isPending = status === 'PENDING';
            const isTaken = status === 'TAKEN';
            const isSkipped = status === 'SKIPPED';

            return (
              <li
                key={intake.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors',
                  isTaken && 'border-emerald-500/30 bg-emerald-500/5',
                  isSkipped && 'border-muted bg-muted/30 opacity-70',
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
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
                    {(time || moment) && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3 shrink-0" aria-hidden="true" />
                        <span className="tabular-nums">{time}</span>
                        {moment && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{moment}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isPending ? (
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 min-w-[44px] border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                      onClick={() => onTake(intake.id)}
                      aria-label={t('patient.pillbox.markTaken')}
                      title={t('patient.pillbox.markTaken')}
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 min-w-[44px] text-muted-foreground"
                      onClick={() => onSkip(intake.id)}
                      aria-label={t('patient.pillbox.markSkipped')}
                      title={t('patient.pillbox.markSkipped')}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 font-medium text-[11px]',
                      isTaken
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isTaken ? t('patient.pillbox.taken') : t('patient.pillbox.skipped')}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
