import { CheckCircle2, Circle, Clock, Pill, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InfiniteList } from '@/components/infinite-list';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Intake {
  id: string;
  status?: string;
  scheduledTime?: string;
  medicationName?: string;
  medicationForm?: string | null;
  dosageLabel?: string | null;
  intakeMoment?: string | null;
  quantity?: string | null;
  unit?: string | null;
}

interface Medication {
  id: string;
  medicationName?: string;
  medicationForm?: string | null;
  dosageLabel?: string | null;
  isActive?: boolean;
  startDate?: string;
  endDate?: string | null;
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

type StatusTone = {
  icon: typeof CheckCircle2;
  iconClass: string;
  badgeClass: string;
};

const statusTone: Record<string, StatusTone> = {
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full bg-primary/10"
          >
            <Pill className="size-6 text-primary" />
          </div>
          <p className="font-semibold">{t('doctor.patientPillbox.empty')}</p>
          <p className="text-muted-foreground text-sm">
            {t('doctor.patientPillbox.emptyTodayDescription', {
              defaultValue: 'No intakes scheduled for today.',
            })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...intakes].sort((a, b) => {
    const ta = a.scheduledTime ?? '99:99';
    const tb = b.scheduledTime ?? '99:99';
    return ta.localeCompare(tb);
  });

  return (
    <ul className="space-y-2.5">
      {sorted.map(intake => {
        const medName = intake.medicationName ?? '—';
        const time = intake.scheduledTime ?? '';
        const moment = intake.intakeMoment;
        const quantity = intake.quantity;
        const unit = intake.unit;
        const dosage = intake.dosageLabel;
        const status = (intake.status ?? 'PENDING').toUpperCase();
        const tone = statusTone[status] ?? statusTone.PENDING;
        const StatusIcon = tone.icon;

        return (
          <li key={intake.id}>
            <Card className="overflow-hidden">
              <CardContent className="flex items-stretch gap-0 p-0">
                <div
                  aria-hidden="true"
                  className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 border-r bg-primary/5 px-2 py-3 text-center"
                >
                  <Clock className="size-3.5 text-primary" />
                  <span className="font-semibold text-sm tabular-nums">{time || '—'}</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-3 p-3 sm:p-4">
                  <Pill className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sm">{medName}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground text-xs">
                      {dosage && <span>{dosage}</span>}
                      {quantity && (
                        <span className="tabular-nums">
                          {quantity}
                          {unit ? ` ${unit}` : ''}
                        </span>
                      )}
                      {moment && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                          {moment}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge
                    className={cn('shrink-0 gap-1 border-transparent font-medium', tone.badgeClass)}
                  >
                    <StatusIcon className={cn('size-3.5', tone.iconClass)} aria-hidden="true" />
                    {status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
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
      renderItem={med => {
        const active = med.isActive !== false;
        return (
          <Card key={med.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Pill className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm">{med.medicationName ?? '—'}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
                    {med.dosageLabel && <span>{med.dosageLabel}</span>}
                    {med.medicationForm && <span>{med.medicationForm}</span>}
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  'shrink-0 border-transparent font-medium',
                  active
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {active
                  ? t('doctor.patientPillbox.active', { defaultValue: 'Active' })
                  : t('doctor.patientPillbox.inactive', { defaultValue: 'Inactive' })}
              </Badge>
            </CardContent>
          </Card>
        );
      }}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      emptyIcon={<Pill className="size-12" />}
      emptyTitle={t('doctor.patientPillbox.empty')}
    />
  );
}
