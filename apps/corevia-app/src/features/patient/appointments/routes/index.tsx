import { Calendar, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { InfiniteList } from '@/components/infinite-list';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useMyAppointments } from '@/queries/patient/useMyAppointments';
import { AppointmentCard } from '../components/appointment-card';

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

export default function PatientAppointments() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();
  const [status, setStatus] = useState<string>('');

  const query = useMyAppointments(status ? { status } : {});

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const items =
    query.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">{t('patient.appointments.title')}</h1>
        <Button size="sm" asChild>
          <Link to="/patient/doctors">
            <Plus className="h-4 w-4" />
            {t('patient.appointments.book')}
          </Link>
        </Button>
      </div>

      <Select value={status} onValueChange={v => setStatus(v === 'ALL' ? '' : v)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder={t('patient.appointments.filterByStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t('patient.appointments.allStatuses')}</SelectItem>
          {STATUSES.map(s => (
            <SelectItem key={s} value={s}>
              {t(`patient.appointments.status.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <InfiniteList
        items={items}
        renderItem={item => (
          <AppointmentCard
            key={(item as Record<string, unknown>).id as string}
            appointment={item as Parameters<typeof AppointmentCard>[0]['appointment']}
          />
        )}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        fetchNextPage={query.fetchNextPage}
        emptyIcon={<Calendar className="h-12 w-12" />}
        emptyTitle={t('patient.appointments.empty')}
        emptyDescription={t('patient.appointments.emptyDescription')}
      />
    </div>
  );
}
