import { Calendar, Clock, User } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './status-badge';

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time?: string;
    status: string;
    reason?: string;
    doctor?: {
      name?: string;
      user?: { name?: string };
      specialty?: string;
    };
  };
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const doctorName = appointment.doctor?.user?.name ?? appointment.doctor?.name ?? '—';
  const specialty = appointment.doctor?.specialty;

  return (
    <Link to={`/patient/appointments/${appointment.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{doctorName}</span>
                {specialty && <span className="text-muted-foreground text-xs">({specialty})</span>}
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
        </CardContent>
      </Card>
    </Link>
  );
}
