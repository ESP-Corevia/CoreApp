import { Calendar, Clock, User } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { StatusActions } from './status-actions';
import { StatusBadge } from './status-badge';

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time?: string;
    status: string;
    reason?: string;
    patient?: {
      name?: string;
      user?: { name?: string };
    };
  };
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const patientName = appointment.patient?.user?.name ?? appointment.patient?.name ?? '—';

  return (
    <Link to={`/doctor/appointments/${appointment.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{patientName}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(appointment.date).toLocaleDateString()}</span>
                </div>
                {appointment.time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{appointment.time}</span>
                  </div>
                )}
              </div>
              {appointment.reason && (
                <p className="line-clamp-1 text-muted-foreground text-xs">{appointment.reason}</p>
              )}
            </div>
            <StatusBadge status={appointment.status} />
          </div>
          <StatusActions appointmentId={appointment.id} status={appointment.status} />
        </CardContent>
      </Card>
    </Link>
  );
}
