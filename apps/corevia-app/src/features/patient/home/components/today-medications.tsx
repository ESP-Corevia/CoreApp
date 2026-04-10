import { Check, Pill, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('patient.home.todaysMedications')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('patient.home.noMedications')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('patient.home.todaysMedications')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {intakes.map(intake => {
          const medName = intake.schedule?.medication?.medicationName ?? '—';
          const time = intake.schedule?.intakeTime ?? intake.scheduledTime ?? '';
          const status = intake.status ?? 'PENDING';
          const isPending = status === 'PENDING';

          return (
            <div
              key={intake.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{medName}</p>
                  {time && <p className="text-muted-foreground text-xs">{time}</p>}
                </div>
              </div>
              {isPending ? (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => onTake(intake.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onSkip(intake.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Badge variant={status === 'TAKEN' ? 'default' : 'secondary'}>
                  {status === 'TAKEN' ? t('patient.pillbox.taken') : t('patient.pillbox.skipped')}
                </Badge>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
