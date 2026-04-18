import { ChevronRight, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
      city?: string;
    };
  };
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(raw?: string): string {
  if (!raw) return '';
  const match = raw.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : raw;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const { i18n } = useTranslation();
  const doctorName = appointment.doctor?.user?.name ?? appointment.doctor?.name ?? '—';
  const specialty = appointment.doctor?.specialty;

  const date = new Date(appointment.date);
  const validDate = !Number.isNaN(date.getTime());
  const day = validDate
    ? new Intl.DateTimeFormat(i18n.language, { day: '2-digit' }).format(date)
    : '--';
  const month = validDate
    ? new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(date).toUpperCase()
    : '';
  const weekday = validDate
    ? new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(date)
    : '';

  const isInactive = appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED';

  return (
    <Link
      to={`/patient/appointments/${appointment.id}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        className={cn(
          'group overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
          isInactive && 'opacity-80',
        )}
      >
        <CardContent className="flex items-stretch gap-0 p-0">
          <div
            className={cn(
              'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-r py-3 text-center sm:w-20',
              isInactive ? 'bg-muted/50 text-muted-foreground' : 'bg-primary/5 text-primary',
            )}
            aria-hidden="true"
          >
            <span className="text-[10px] uppercase tracking-wider opacity-70">{weekday}</span>
            <span className="font-semibold text-xl tabular-nums leading-none sm:text-2xl">
              {day}
            </span>
            <span className="text-[10px] uppercase tracking-wider opacity-70">{month}</span>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <Avatar className="hidden size-10 shrink-0 sm:inline-flex">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 font-medium text-primary text-xs">
                {getInitials(doctorName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="truncate font-medium text-sm" title={doctorName}>
                  {doctorName}
                </p>
                {appointment.time && (
                  <span className="shrink-0 font-medium text-muted-foreground text-xs tabular-nums">
                    {formatTime(appointment.time)}
                  </span>
                )}
              </div>
              {specialty && (
                <div className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
                  <Stethoscope className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{specialty}</span>
                </div>
              )}
              {appointment.reason && (
                <p
                  className="mt-0.5 line-clamp-1 text-muted-foreground/80 text-xs italic"
                  title={appointment.reason}
                >
                  {appointment.reason}
                </p>
              )}
              <div className="mt-1.5 sm:hidden">
                <StatusBadge status={appointment.status} />
              </div>
            </div>

            <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
              <StatusBadge status={appointment.status} />
              <ChevronRight
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
            <ChevronRight
              className="size-4 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:hidden"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
