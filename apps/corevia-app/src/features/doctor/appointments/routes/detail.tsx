import { ArrowLeft, Calendar, Clock, FileText, Pill, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useDoctorAppointmentDetail } from '@/queries/doctor';
import { StatusActions } from '../components/status-actions';
import { StatusBadge } from '../components/status-badge';

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const patientId = patient?.id as string | undefined;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/appointments')}>
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !appointment ? (
        <p className="text-muted-foreground">{t('common.error')}</p>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('doctor.appointments.title')}</CardTitle>
              <StatusBadge status={appointment.status as string} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">{patientName}</span>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                {new Date(appointment.date as string).toLocaleDateString()}
              </span>
            </div>

            {appointment.time && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{appointment.time as string}</span>
              </div>
            )}

            {appointment.reason && (
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{appointment.reason as string}</span>
              </div>
            )}

            <StatusActions
              appointmentId={appointment.id as string}
              status={appointment.status as string}
            />

            {patientId && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/doctor/patients/${patientId}/pillbox`}>
                  <Pill className="h-4 w-4" />
                  {t('doctor.patientPillbox.title')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
