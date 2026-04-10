import { ArrowLeft, Calendar, Clock, FileText, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useAppointmentDetail } from '@/queries/patient/useAppointmentDetail';
import { StatusBadge } from '../components/status-badge';

export default function PatientAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const { data, isLoading } = useAppointmentDetail(id ?? '');

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const appointment = data as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/patient/appointments')}>
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : !appointment ? (
        <p className="text-muted-foreground">{t('common.error')}</p>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('patient.appointments.title')}</CardTitle>
              <StatusBadge status={appointment.status as string} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">
                  {((
                    (appointment.doctor as Record<string, unknown>)?.user as Record<string, unknown>
                  )?.name as string) ??
                    ((appointment.doctor as Record<string, unknown>)?.name as string) ??
                    '—'}
                </p>
                {(appointment.doctor as Record<string, unknown>)?.specialty && (
                  <p className="text-muted-foreground text-xs">
                    {(appointment.doctor as Record<string, unknown>).specialty as string}
                  </p>
                )}
              </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
