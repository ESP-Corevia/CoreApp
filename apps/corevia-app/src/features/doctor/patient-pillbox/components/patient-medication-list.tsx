import { Clock, Pill } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InfiniteList } from '@/components/infinite-list';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Intake {
  id: string;
  status?: string;
  scheduledTime?: string;
  schedule?: {
    intakeTime?: string;
    intakeMoment?: string;
    quantity?: string;
    unit?: string;
    medication?: { medicationName?: string };
  };
}

interface Medication {
  id: string;
  medicationName?: string;
  dosageLabel?: string;
  active?: boolean;
}

interface TodayScheduleProps {
  intakes: Intake[];
  isLoading: boolean;
}

interface MedicationListProps {
  medications: Medication[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  TAKEN: 'default',
  SKIPPED: 'destructive',
  PENDING: 'secondary',
};

export function TodayScheduleReadOnly({ intakes, isLoading }: TodayScheduleProps) {
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
        <p className="text-muted-foreground text-sm">{t('doctor.patientPillbox.empty')}</p>
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
                      {time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {time}
                        </span>
                      )}
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
                <Badge variant={statusVariant[status] ?? 'outline'}>{status}</Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function PatientMedicationList({
  medications,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: MedicationListProps) {
  const { t } = useTranslation();

  return (
    <InfiniteList
      items={medications}
      renderItem={med => (
        <Card key={med.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Pill className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{med.medicationName ?? '—'}</p>
                {med.dosageLabel && (
                  <p className="text-muted-foreground text-xs">{med.dosageLabel}</p>
                )}
              </div>
            </div>
            <Badge variant={med.active !== false ? 'default' : 'secondary'}>
              {med.active !== false ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
      )}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      emptyIcon={<Pill className="h-12 w-12" />}
      emptyTitle={t('doctor.patientPillbox.empty')}
    />
  );
}
