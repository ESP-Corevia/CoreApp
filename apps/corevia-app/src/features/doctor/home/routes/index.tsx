import { CalendarDays, CheckCircle2, Clock3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GreetingBanner } from '@/components/greeting-banner';
import Loader from '@/components/loader';
import { StatCard } from '@/components/stat-card';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { authClient } from '@/lib/auth-client';
import { useDoctorMyAppointments } from '@/queries/doctor';
import { TodaysAppointments } from '../components/todays-appointments';

export default function DoctorHome() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();
  const { data: session } = authClient.useSession();

  const appointmentsQuery = useDoctorMyAppointments();

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const sessionAny = session as unknown as Record<string, unknown> | null;
  const user = sessionAny?.user as Record<string, unknown> | undefined;
  const userName = user?.name as string | undefined;

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

  const pendingCount = todaysAppointments.filter(a => a.status === 'PENDING').length;
  const completedCount = todaysAppointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-5 md:space-y-6">
      <GreetingBanner
        name={userName}
        audience="doctor"
        stat={{ label: t('doctor.home.statsToday'), value: todaysAppointments.length }}
      />

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard
          label={t('doctor.home.statsToday')}
          value={todaysAppointments.length}
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          label={t('doctor.home.statsPending')}
          value={pendingCount}
          icon={Clock3}
          tone="warning"
        />
        <StatCard
          label={t('doctor.home.statsCompleted')}
          value={completedCount}
          icon={CheckCircle2}
          tone="accent"
        />
      </div>

      <section aria-labelledby="todays-appointments-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="todays-appointments-heading" className="font-semibold text-base md:text-lg">
            {t('doctor.home.todaysAppointments')}
          </h2>
        </div>
        <TodaysAppointments
          appointments={todaysAppointments}
          isLoading={appointmentsQuery.isLoading}
        />
      </section>
    </div>
  );
}
