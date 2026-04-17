import { Check, CircleCheck, Pill, SkipForward, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Intake {
  id: string;
  status?: string;
  scheduledTime?: string;
  schedule?: {
    intakeTime?: string;
    intakeMoment?: string;
    medication?: {
      medicationName?: string;
    };
  };
}

interface TodayMedicationsProps {
  intakes: Intake[];
  onTake: (id: string) => void;
  onSkip: (id: string) => void;
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

  return (
    <Card>
      <CardContent className="p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
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
          {intakes.map(intake => {
            const medName = intake.schedule?.medication?.medicationName ?? '—';
            const time = intake.schedule?.intakeTime ?? intake.scheduledTime ?? '';
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
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg',
                      isTaken
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : isSkipped
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary',
                    )}
                    aria-hidden="true"
                  >
                    {isTaken ? (
                      <Check className="size-4" />
                    ) : isSkipped ? (
                      <SkipForward className="size-4" />
                    ) : (
                      <Pill className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate font-medium text-sm', isSkipped && 'line-through')}>
                      {medName}
                    </p>
                    {time && <p className="text-muted-foreground text-xs tabular-nums">{time}</p>}
                  </div>
                </div>
                {isPending ? (
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 min-w-[44px] gap-1"
                      onClick={() => onTake(intake.id)}
                      aria-label={t('patient.pillbox.markTaken')}
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 min-w-[44px] text-muted-foreground"
                      onClick={() => onSkip(intake.id)}
                      aria-label={t('patient.pillbox.markSkipped')}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <span
                    className={cn(
                      'shrink-0 font-medium text-xs',
                      isTaken ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground',
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
