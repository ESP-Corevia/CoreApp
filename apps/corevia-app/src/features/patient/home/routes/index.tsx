import { Calendar, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
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

  const appointments = useMyAppointments();
  const pillboxToday = usePillboxToday();
  const markTaken = useMarkIntakeTaken();
  const markSkipped = useMarkIntakeSkipped();

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

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

  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl">{t('patient.home.title')}</h1>

      <SummaryCards upcomingCount={upcomingCount} todayMedCount={todayIntakes.length} />

      <NextAppointmentCard appointment={nextAppointment ?? null} />

      <TodayMedications
        intakes={todayIntakes as Parameters<typeof TodayMedications>[0]['intakes']}
        onTake={id => markTaken.mutate({ id })}
        onSkip={id => markSkipped.mutate({ id })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button asChild>
          <Link to="/patient/doctors">
            <Search className="h-4 w-4" />
            {t('patient.home.bookAppointment')}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/patient/appointments">
            <Calendar className="h-4 w-4" />
            {t('patient.home.viewAll')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
