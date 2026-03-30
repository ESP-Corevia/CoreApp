import { ClipboardCopy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PatientDeleteDialog } from './modals/patient-delete-dialog';
import { PatientEditDialog } from './modals/patient-edit-dialog';
import type { Patient } from './patients-table';

interface PatientActionsMenuProps {
  patient: Patient;
}

export function PatientActionsMenu({ patient }: PatientActionsMenuProps) {
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('patients.openMenu', 'Open patient menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(patient.userId);
              toast.success(t('users.idCopied', 'User ID copied to clipboard'));
            }}
          >
            <ClipboardCopy className="mr-2 h-4 w-4" />
            <Trans i18nKey="patients.copyId">Copy ID</Trans>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            <Trans i18nKey="patients.edit">Edit Profile</Trans>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <Trans i18nKey="patients.deleteProfile">Delete Profile</Trans>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PatientEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} patient={patient} />
      <PatientDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        patient={patient}
      />
    </>
  );
}
