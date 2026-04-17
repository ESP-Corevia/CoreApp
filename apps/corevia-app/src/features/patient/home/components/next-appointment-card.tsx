import { ArrowUpRight, Calendar, Clock, MapPin, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Doctor {
  name?: string;
  specialty?: string;
  city?: string;
  user?: { name?: string };
}

interface NextAppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time?: string;
    status: string;
    doctor?: Doctor;
  } | null;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NextAppointmentCard({ appointment }: NextAppointmentCardProps) {
  const { t, i18n } = useTranslation();

  if (!appointment) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{t('patient.home.nextAppointment')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('patient.home.noUpcomingDescription')}
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/patient/doctors">
              <Stethoscope className="size-4" aria-hidden="true" />
              {t('patient.home.bookAppointment')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const doctorName = appointment.doctor?.user?.name ?? appointment.doctor?.name ?? '—';
  const specialty = appointment.doctor?.specialty;
  const city = appointment.doctor?.city;
  const statusKey = appointment.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  const statusVariant =
    statusKey === 'CONFIRMED'
      ? 'default'
      : statusKey === 'PENDING'
        ? 'secondary'
        : statusKey === 'CANCELLED'
          ? 'destructive'
          : 'outline';

  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(appointment.date));

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/40" aria-hidden="true" />
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {t('patient.home.nextAppointment')}
          </p>
          <Badge variant={statusVariant} className="uppercase">
            {t(`patient.appointments.status.${statusKey}`)}
          </Badge>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <Avatar className="size-12 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/5 font-semibold text-primary">
              {getInitials(doctorName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-base">{doctorName}</p>
            {specialty && <p className="truncate text-muted-foreground text-sm">{specialty}</p>}
            {city && (
              <div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin className="size-3" aria-hidden="true" />
                <span className="truncate">{city}</span>
              </div>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="sr-only">Date</dt>
              <dd className="font-medium text-sm">{formattedDate}</dd>
            </div>
          </div>
          {appointment.time && (
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="sr-only">Time</dt>
                <dd className="font-medium text-sm tabular-nums">{appointment.time}</dd>
              </div>
            </div>
          )}
        </dl>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/patient/appointments/${appointment.id}`}>
              {t('common.detail', { defaultValue: 'Details' })}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
