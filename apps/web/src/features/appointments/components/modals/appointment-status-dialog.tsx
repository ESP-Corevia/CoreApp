import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUpdateAppointmentStatus } from '@/queries';

import type { Appointment } from '../appointments-table';

interface AppointmentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
  targetStatus: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirm',
  COMPLETED: 'Complete',
  CANCELLED: 'Cancel',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  CONFIRMED: 'confirm this appointment',
  COMPLETED: 'mark this appointment as completed',
  CANCELLED: 'cancel this appointment',
};

export function AppointmentStatusDialog({
  open,
  onOpenChange,
  appointment,
  targetStatus,
}: AppointmentStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useUpdateAppointmentStatus();

  const handleConfirm = () => {
    mutation.mutate(
      { id: appointment.id, status: targetStatus },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  const label = STATUS_LABELS[targetStatus] ?? targetStatus;
  const description = STATUS_DESCRIPTIONS[targetStatus] ?? 'update this appointment';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('appointments.statusDialog.title', '{{action}} Appointment', { action: label })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'appointments.statusDialog.description',
              'Are you sure you want to {{action}}? Patient: {{patient}}, Doctor: {{doctor}}, Date: {{date}} at {{time}}.',
              {
                action: description,
                patient: appointment.patientName ?? 'Unknown',
                doctor: appointment.doctorName ?? 'Unknown',
                date: appointment.date,
                time: appointment.time,
              },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className={
              targetStatus === 'CANCELLED'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {mutation.isPending
              ? t('common.processing', 'Processing...')
              : t('appointments.statusDialog.confirm', '{{action}}', { action: label })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
