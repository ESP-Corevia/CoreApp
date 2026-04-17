import { CalendarPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { GreetingBanner } from '@/components/greeting-banner';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { authClient } from '@/lib/auth-client';
import { useMarkIntakeSkipped } from '@/queries/patient/useMarkIntakeSkipped';
import { useMarkIntakeTaken } from '@/queries/patient/useMarkIntakeTaken';
import { useMyAppointments } from '@/queries/patient/useMyAppointments';
import { usePillboxToday } from '@/queries/patient/usePillboxToday';
import { NextAppointmentCard } from '../components/next-appointment-card';
import { SummaryCards } from '../components/summary-cards';
import { TodayMedications } from '../components/today-medications';

export default function PatientHome() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();
  const { data: session } = authClient.useSession();

  const appointments = useMyAppointments();
  const pillboxToday = usePillboxToday();
  const markTaken = useMarkIntakeTaken();
  const markSkipped = useMarkIntakeSkipped();

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const sessionAny = session as unknown as Record<string, unknown> | null;
  const user = sessionAny?.user as Record<string, unknown> | undefined;
  const userName = user?.name as string | undefined;

  const allAppointments =
    appointments.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  const upcomingCount = allAppointments.filter(
    a => a.status === 'PENDING' || a.status === 'CONFIRMED',
  ).length;

  const nextAppointment = allAppointments.find(
    a => a.status === 'PENDING' || a.status === 'CONFIRMED',
  ) as Parameters<typeof NextAppointmentCard>[0]['appointment'] | undefined;

  const todayIntakes =
    ((pillboxToday.data as Record<string, unknown>)?.intakes as Array<Record<string, unknown>>) ??
    (Array.isArray(pillboxToday.data) ? pillboxToday.data : []);

  const takenCount = todayIntakes.filter(i => i.status === 'TAKEN').length;

  return (
    <div className="space-y-5 md:space-y-6">
      <GreetingBanner
        name={userName}
        audience="patient"
        stat={{ label: t('patient.home.upcomingAppointments'), value: upcomingCount }}
        action={
          <Button asChild size="sm">
            <Link to="/patient/doctors">
              <CalendarPlus className="size-4" aria-hidden="true" />
              {t('patient.home.bookAppointment')}
            </Link>
          </Button>
        }
      />

      <SummaryCards
        upcomingCount={upcomingCount}
        todayMedCount={todayIntakes.length}
        takenMedCount={takenCount}
      />

      <NextAppointmentCard appointment={nextAppointment ?? null} />

      <TodayMedications
        intakes={todayIntakes as unknown as Parameters<typeof TodayMedications>[0]['intakes']}
        onTake={id => markTaken.mutate({ id })}
        onSkip={id => markSkipped.mutate({ id })}
      />
    </div>
  );
}
