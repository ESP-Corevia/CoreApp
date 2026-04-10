import { Calendar, Pill } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

interface SummaryCardsProps {
  upcomingCount: number;
  todayMedCount: number;
}

export function SummaryCards({ upcomingCount, todayMedCount }: SummaryCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-2xl">{upcomingCount}</p>
            <p className="text-muted-foreground text-xs">
              {t('patient.home.upcomingAppointments')}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-2xl">{todayMedCount}</p>
            <p className="text-muted-foreground text-xs">{t('patient.home.todaysMedications')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
