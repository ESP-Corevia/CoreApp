import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfiniteList } from '@/components/infinite-list';
import Loader from '@/components/loader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useDoctorMyAppointments } from '@/queries/doctor';
import { AppointmentCard } from '../components/appointment-card';

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

export default function DoctorAppointments() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();
  const [status, setStatus] = useState<string>('');

  const query = useDoctorMyAppointments(status ? { status } : {});

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const items =
    query.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-bold text-2xl">{t('doctor.appointments.title')}</h1>

      <Select value={status} onValueChange={v => setStatus(v === 'ALL' ? '' : v)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder={t('doctor.appointments.filterByStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t('doctor.appointments.allStatuses')}</SelectItem>
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
        emptyTitle={t('doctor.appointments.empty')}
        emptyDescription={t('doctor.appointments.emptyDescription')}
      />
    </div>
  );
}
