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
import { useDeletePatient } from '@/queries';

import type { Patient } from '../patients-table';

interface PatientDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

export function PatientDeleteDialog({ open, onOpenChange, patient }: PatientDeleteDialogProps) {
  const { t } = useTranslation();
  const mutation = useDeletePatient();

  const handleConfirm = () => {
    mutation.mutate(patient.userId, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('patients.deleteDialog.title', 'Delete Patient Profile')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'patients.deleteDialog.description',
              'Are you sure you want to delete the patient profile for {{name}}? This will remove their medical data but not their user account.',
              { name: patient.name },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending
              ? t('patients.deleting', 'Deleting...')
              : t('patients.delete', 'Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
