import { useTranslation } from 'react-i18next';
import Loader from '@/components/loader';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useDoctorMyAppointments } from '@/queries/doctor';
import { TodaysAppointments } from '../components/todays-appointments';

export default function DoctorHome() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();

  const appointmentsQuery = useDoctorMyAppointments();

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const today = new Date().toDateString();

  const allAppointments =
    appointmentsQuery.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  const todaysAppointments = allAppointments.filter(appt => {
    const apptDate = new Date(appt.date as string).toDateString();
    return apptDate === today;
  }) as Array<{
    id: string;
    date: string;
    time?: string;
    status: string;
    reason?: string;
    patient?: { name?: string; user?: { name?: string } };
  }>;

  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl">{t('doctor.home.title')}</h1>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">{t('doctor.home.todaysAppointments')}</h2>
        <TodaysAppointments
          appointments={todaysAppointments}
          isLoading={appointmentsQuery.isLoading}
        />
      </section>
    </div>
  );
}
