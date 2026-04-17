import { CalendarDays, PillBottle, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/stat-card';

interface SummaryCardsProps {
  upcomingCount: number;
  todayMedCount: number;
  takenMedCount: number;
}

export function SummaryCards({ upcomingCount, todayMedCount, takenMedCount }: SummaryCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      <StatCard
        label={t('patient.home.upcomingAppointments')}
        value={upcomingCount}
        icon={CalendarDays}
        tone="primary"
        to="/patient/appointments"
      />
      <StatCard
        label={t('patient.home.todaysMedications')}
        value={todayMedCount}
        icon={PillBottle}
        tone="accent"
        hint={
          todayMedCount > 0
            ? t('patient.home.medicationsProgress', { taken: takenMedCount, total: todayMedCount })
            : undefined
        }
        to="/patient/pillbox"
      />
      <StatCard
        label={t('patient.home.viewDoctors')}
        value={'→'}
        icon={Stethoscope}
        tone="muted"
        to="/patient/doctors"
      />
    </div>
  );
}
