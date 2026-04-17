import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  FileText,
  Mail,
  Phone,
  PillBottle,
  RefreshCw,
  User,
} from 'lucide-react';
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
import {
  useCachedPatientForAppointment,
  useDoctorAppointmentDetail,
} from '@/queries/doctor';
import { PatientDocuments } from '../components/patient-documents';
import { StatusActions } from '../components/status-actions';
import { StatusBadge } from '../components/status-badge';

function getInitials(name?: string | null): string {
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

function formatAge(dob?: string | null): string | null {
  if (!dob) return null;
  const [y, m, d] = dob.split('-').map(Number);
  if (!y || !m || !d) return null;
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const before =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (before) age -= 1;
  return String(age);
}

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();

  const detailQuery = useDoctorAppointmentDetail(id ?? '');
  const cachedPatient = useCachedPatientForAppointment(id);

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const appointment = detailQuery.data as Record<string, unknown> | undefined;
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
  const patientName = cachedPatient?.name ?? null;
  const patientEmail = cachedPatient?.email ?? null;
  const patientPhone = cachedPatient?.phone ?? null;
  const patientDob = cachedPatient?.dateOfBirth ?? null;
  const patientGender = cachedPatient?.gender ?? null;
  const patientAge = formatAge(patientDob);

  const isLoading = detailQuery.isLoading;
  const isError = detailQuery.isError;
  const isFetching = detailQuery.isFetching;

  const handleRefresh = () => {
    void queryClient.invalidateQueries({
      predicate: q => {
        const k = q.queryKey;
        if (!Array.isArray(k) || k.length === 0) return false;
        const head = k[0];
        if (Array.isArray(head))
          return head[0] === 'doctor' && head[1] === 'appointments';
        return head === 'doctor' && k[1] === 'appointments';
      },
    });
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/doctor/appointments')}
          className="-ml-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('common.back')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          aria-label={t('common.refresh', { defaultValue: 'Refresh' })}
          className="gap-2 text-muted-foreground"
        >
          <RefreshCw
            className={cn('size-4 transition-transform', isFetching && 'animate-spin')}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            {isFetching
              ? t('common.refreshing', { defaultValue: 'Refreshing…' })
              : t('common.refresh', { defaultValue: 'Refresh' })}
          </span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : isError || !appointment ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-full bg-muted"
            >
              <CalendarDays className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">
                {t('doctor.appointments.notFound', { defaultValue: 'Appointment not found' })}
              </p>
              <p className="text-muted-foreground text-sm">
                {t('doctor.appointments.notFoundDescription', {
                  defaultValue: 'It may have been cancelled or removed.',
                })}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              {t('common.retry', { defaultValue: 'Retry' })}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div
              className={cn(
                'h-1 w-full',
                status === 'PENDING' && 'bg-gradient-to-r from-amber-400 to-amber-500/50',
                status === 'CONFIRMED' && 'bg-gradient-to-r from-primary to-primary/40',
                status === 'COMPLETED' && 'bg-gradient-to-r from-emerald-500 to-emerald-500/40',
                status === 'CANCELLED' && 'bg-muted',
              )}
              aria-hidden="true"
            />
            <CardContent className="space-y-5 p-4 sm:p-5 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
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
            <CardContent className="flex items-start gap-4 p-4 sm:p-5 md:p-6">
              <Avatar className="size-12 shrink-0 ring-1 ring-border sm:size-14">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 font-semibold text-primary">
                  {getInitials(patientName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-1.5">
                  <User
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <h2 className="truncate font-semibold text-base">
                    {patientName ??
                      t('doctor.appointments.unknownPatient', { defaultValue: 'Patient' })}
                  </h2>
                </div>
                {(patientAge || patientGender) && (
                  <p className="text-muted-foreground text-xs">
                    {[
                      patientAge &&
                        t('doctor.appointments.ageYears', {
                          defaultValue: '{{n}} yrs',
                          n: patientAge,
                        }),
                      patientGender,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                <dl className="grid grid-cols-1 gap-1.5 pt-1 sm:grid-cols-2">
                  {patientEmail && (
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <a
                        href={`mailto:${patientEmail}`}
                        className="truncate rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {patientEmail}
                      </a>
                    </div>
                  )}
                  {patientPhone && (
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <Phone
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <a
                        href={`tel:${patientPhone}`}
                        className="truncate rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {patientPhone}
                      </a>
                    </div>
                  )}
                </dl>
              </div>
            </CardContent>
          </Card>

          {reason && (
            <Card>
              <CardContent className="space-y-2 p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <FileText
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <h2 className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                    {t('doctor.appointments.reason')}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed">{reason}</p>
              </CardContent>
            </Card>
          )}

          <PatientDocuments patientUserId={appointment.patientId as string | undefined} />

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-start gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <p className="text-muted-foreground text-sm">
                {t('doctor.appointments.viewPillboxDescription', {
                  defaultValue: "Review the patient's current medications.",
                })}
              </p>
              <Button variant="outline" size="sm" asChild disabled={!appointment.patientId}>
                <Link to={`/doctor/patients/${appointment.patientId as string}/pillbox`}>
                  <PillBottle className="size-4" aria-hidden="true" />
                  {t('doctor.appointments.viewPillbox')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
