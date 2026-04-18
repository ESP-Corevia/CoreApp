import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useUpdateAppointmentStatus } from '@/queries/doctor';

interface StatusActionsProps {
  appointmentId: string;
  status: string;
}

export function StatusActions({ appointmentId, status }: StatusActionsProps) {
  const { t } = useTranslation();
  const updateStatus = useUpdateAppointmentStatus();

  const isPending = updateStatus.isPending;

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'PENDING' && (
        <Button
          size="sm"
          variant="default"
          disabled={isPending}
          className="h-8 flex-1 sm:flex-initial"
          onClick={e => {
            e.preventDefault();
            updateStatus.mutate({ id: appointmentId, status: 'CONFIRMED' });
          }}
        >
          {t('doctor.appointments.confirm')}
        </Button>
      )}
      {(status === 'PENDING' || status === 'CONFIRMED') && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          className="h-8 flex-1 sm:flex-initial"
          onClick={e => {
            e.preventDefault();
            updateStatus.mutate({ id: appointmentId, status: 'COMPLETED' });
          }}
        >
          {t('doctor.appointments.complete')}
        </Button>
      )}
      {(status === 'PENDING' || status === 'CONFIRMED') && (
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          className="h-8 flex-1 sm:flex-initial"
          onClick={e => {
            e.preventDefault();
            updateStatus.mutate({ id: appointmentId, status: 'CANCELLED' });
          }}
        >
          {t('doctor.appointments.cancel')}
        </Button>
      )}
    </div>
  );
}
