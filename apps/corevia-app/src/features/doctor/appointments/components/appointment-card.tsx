import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
  const patientName = appointment.patient?.user?.name ?? appointment.patient?.name ?? '—';
  const isInactive = appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED';

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

  return (
    <Card className={cn('overflow-hidden transition-colors', isInactive && 'opacity-80')}>
      <CardContent className="p-0">
        <Link
          to={`/doctor/appointments/${appointment.id}`}
          className="group flex items-stretch gap-0 focus-visible:outline-none"
        >
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

          <div className="flex min-w-0 flex-1 items-center gap-2 p-3 transition-colors group-hover:bg-accent/30 sm:gap-3 sm:p-4">
            <Avatar className="hidden size-10 shrink-0 sm:inline-flex">
              <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
                {getInitials(patientName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="truncate font-medium text-sm" title={patientName}>
                  {patientName}
                </p>
                {appointment.time && (
                  <span className="shrink-0 font-medium text-muted-foreground text-xs tabular-nums">
                    {formatTime(appointment.time)}
                  </span>
                )}
              </div>
              {appointment.reason && (
                <p
                  className="mt-0.5 line-clamp-1 text-muted-foreground text-xs"
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
        </Link>

        {!isInactive && (
          <div className="overflow-x-auto border-t bg-muted/20 px-3 py-2.5 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
            <StatusActions appointmentId={appointment.id} status={appointment.status} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
