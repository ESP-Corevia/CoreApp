import { Pill } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IntakeActions } from './intake-actions';

interface Intake {
  id: string;
  status?: string;
  scheduledTime?: string;
  schedule?: {
    intakeTime?: string;
    intakeMoment?: string;
    quantity?: string;
    unit?: string;
    medication?: {
      medicationName?: string;
    };
  };
}

interface TodayScheduleProps {
  intakes: Intake[];
  isLoading: boolean;
  onTake: (id: string) => void;
  onSkip: (id: string) => void;
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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Pill className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('patient.pillbox.noSchedule')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {intakes.map(intake => {
        const medName = intake.schedule?.medication?.medicationName ?? '—';
        const time = intake.schedule?.intakeTime ?? intake.scheduledTime ?? '';
        const moment = intake.schedule?.intakeMoment;
        const quantity = intake.schedule?.quantity;
        const unit = intake.schedule?.unit;
        const status = intake.status ?? 'PENDING';

        return (
          <Card key={intake.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Pill className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{medName}</p>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      {time && <span>{time}</span>}
                      {moment && <span>({moment})</span>}
                      {quantity && (
                        <span>
                          {quantity}
                          {unit ? ` ${unit}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <IntakeActions
                  status={status}
                  onTake={() => onTake(intake.id)}
                  onSkip={() => onSkip(intake.id)}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
