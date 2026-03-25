import { AlertTriangle } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

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
import { useDeleteAppointment } from '@/queries';

import type { Appointment } from '../appointments-table';

interface AppointmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
}

export function AppointmentDeleteDialog({ open, onOpenChange, appointment }: AppointmentDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeleteAppointment();

  const handleDelete = () => {
    mutation.mutate(appointment.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <Trans i18nKey="appointments.deleteDialog.title">Delete Appointment</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'appointments.deleteDialog.description',
              'Are you sure you want to delete the appointment for {{patient}} with {{doctor}} on {{date}} at {{time}}? This action cannot be undone.',
              {
                patient: appointment.patientName ?? 'Unknown',
                doctor: appointment.doctorName ?? 'Unknown',
                date: appointment.date,
                time: appointment.time,
              },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Trans i18nKey="common.cancel">Cancel</Trans>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? (
              <Trans i18nKey="appointments.deleting">Deleting...</Trans>
            ) : (
              <Trans i18nKey="appointments.delete">Delete</Trans>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
