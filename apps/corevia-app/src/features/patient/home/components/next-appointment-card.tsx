import { Calendar, Clock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NextAppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time?: string;
    status: string;
    doctor?: {
      name?: string;
      user?: { name?: string };
    };
  } | null;
}

export function NextAppointmentCard({ appointment }: NextAppointmentCardProps) {
  const { t } = useTranslation();

  if (!appointment) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('patient.home.nextAppointment')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('patient.home.noUpcoming')}</p>
        </CardContent>
      </Card>
    );
  }

  const doctorName = appointment.doctor?.user?.name ?? appointment.doctor?.name ?? '—';
  const statusKey = appointment.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  const statusVariant =
    statusKey === 'CONFIRMED'
      ? 'default'
      : statusKey === 'PENDING'
        ? 'secondary'
        : statusKey === 'CANCELLED'
          ? 'destructive'
          : 'outline';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('patient.home.nextAppointment')}</CardTitle>
          <Badge variant={statusVariant}>{t(`patient.appointments.status.${statusKey}`)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{doctorName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(appointment.date).toLocaleDateString()}</span>
        </div>
        {appointment.time && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.time}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
