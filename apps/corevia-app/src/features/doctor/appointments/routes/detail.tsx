import { ArrowLeft, Calendar, Clock, FileText, PillBottle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { cn } from '@/lib/utils';
import { useDoctorAppointmentDetail } from '@/queries/doctor';
import { StatusActions } from '../components/status-actions';
import { StatusBadge } from '../components/status-badge';

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

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();

  const { data, isLoading } = useDoctorAppointmentDetail(id ?? '');

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const appointment = data as Record<string, unknown> | undefined;
  const patient = appointment?.patient as Record<string, unknown> | undefined;
  const patientName =
    ((patient?.user as Record<string, unknown>)?.name as string) ??
    (patient?.name as string) ??
    '—';
  const patientEmail = (patient?.user as Record<string, unknown>)?.email as string | undefined;
  const patientId = patient?.id as string | undefined;
  const status = (appointment?.status as string | undefined) ?? '';
  const isInactive = status === 'CANCELLED' || status === 'COMPLETED';

  const dateRaw = appointment?.date as string | undefined;
  const timeRaw = appointment?.time as string | undefined;
  const validDate = dateRaw ? !Number.isNaN(new Date(dateRaw).getTime()) : false;
  const longDate = validDate
    ? new Intl.DateTimeFormat(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(dateRaw as string))
    : '';

  const reason = appointment?.reason as string | undefined;

  return (
    <div className="space-y-4 md:space-y-5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/doctor/appointments')}
        className="-ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('common.back')}
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !appointment ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Calendar className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium">{t('common.error')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div
              className={cn(
                'h-1 w-full',
                isInactive ? 'bg-muted' : 'bg-gradient-to-r from-primary to-primary/40',
              )}
              aria-hidden="true"
            />
            <CardContent className="space-y-4 p-4 sm:p-5 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    {t('doctor.appointments.details')}
                  </p>
                  <h1 className="font-semibold text-base leading-snug tracking-tight sm:text-lg md:text-xl">
                    {longDate}
                  </h1>
                  {timeRaw && (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Clock className="size-4" aria-hidden="true" />
                      <span className="font-medium tabular-nums">{formatTime(timeRaw)}</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 self-start">
                  <StatusBadge status={status} />
                </div>
              </div>

              {!isInactive && (
                <div className="border-t pt-4">
                  <StatusActions appointmentId={appointment.id as string} status={status} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5 md:p-6">
              <Avatar className="size-12 shrink-0 sm:size-14">
                <AvatarFallback className="bg-primary/10 font-medium text-primary">
                  {getInitials(patientName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <h2 className="truncate font-semibold text-base">{patientName}</h2>
                </div>
                {patientEmail && (
                  <p className="truncate text-muted-foreground text-sm">{patientEmail}</p>
                )}
                {patientId && (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/doctor/patients/${patientId}/pillbox`}>
                        <PillBottle className="size-4" aria-hidden="true" />
                        {t('doctor.appointments.viewPillbox')}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {reason && (
            <Card>
              <CardContent className="space-y-2 p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                  <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    {t('doctor.appointments.reason')}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed">{reason}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
