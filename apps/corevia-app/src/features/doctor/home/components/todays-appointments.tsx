import { Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="size-6 text-primary" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-base">{t('doctor.home.noAppointments')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('doctor.home.noAppointmentsDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by time ascending
  const sorted = [...appointments].sort((a, b) => {
    const ta = a.time ?? '99:99';
    const tb = b.time ?? '99:99';
    return ta.localeCompare(tb);
  });

  return (
    <ul className="space-y-2.5">
      {sorted.map(appt => {
        const patientName = appt.patient?.user?.name ?? appt.patient?.name ?? '—';
        const isDone = appt.status === 'COMPLETED' || appt.status === 'CANCELLED';

        return (
          <li key={appt.id}>
            <Card className={cn('overflow-hidden transition-colors', isDone && 'opacity-70')}>
              <CardContent className="flex items-stretch gap-0 p-0">
                <div
                  className={cn(
                    'flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 border-r px-3 py-4 text-center',
                    isDone ? 'bg-muted/50' : 'bg-primary/5',
                  )}
                  aria-hidden="true"
                >
                  <Clock
                    className={cn('size-4', isDone ? 'text-muted-foreground' : 'text-primary')}
                  />
                  <span className="font-semibold text-sm tabular-nums">{appt.time ?? '—'}</span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
                          {getInitials(patientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          to={`/doctor/appointments/${appt.id}`}
                          className="truncate rounded-sm font-medium text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {patientName}
                        </Link>
                        {appt.reason && (
                          <p className="line-clamp-1 text-muted-foreground text-xs">
                            {appt.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>

                  <StatusActions appointmentId={appt.id} status={appt.status} />
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}

      <li className="flex justify-end pt-1">
        <Button asChild variant="ghost" size="sm">
          <Link to="/doctor/appointments">{t('doctor.home.viewAll')}</Link>
        </Button>
      </li>
    </ul>
  );
}
