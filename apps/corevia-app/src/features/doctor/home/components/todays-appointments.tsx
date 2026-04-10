import { Calendar, Clock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusActions } from '../../appointments/components/status-actions';
import { StatusBadge } from '../../appointments/components/status-badge';

interface Appointment {
  id: string;
  date: string;
  time?: string;
  status: string;
  reason?: string;
  patient?: {
    name?: string;
    user?: { name?: string };
  };
}

interface TodaysAppointmentsProps {
  appointments: Appointment[];
  isLoading: boolean;
}

export function TodaysAppointments({ appointments, isLoading }: TodaysAppointmentsProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Calendar className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">{t('doctor.home.noAppointments')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map(appt => {
        const patientName = appt.patient?.user?.name ?? appt.patient?.name ?? '—';
        return (
          <Card key={appt.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{patientName}</span>
                  </div>
                  {appt.time && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="h-3 w-3" />
                      <span>{appt.time}</span>
                    </div>
                  )}
                  {appt.reason && (
                    <p className="line-clamp-1 text-muted-foreground text-xs">{appt.reason}</p>
                  )}
                </div>
                <StatusBadge status={appt.status} />
              </div>
              <StatusActions appointmentId={appt.id} status={appt.status} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
