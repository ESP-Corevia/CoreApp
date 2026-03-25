import { CheckCircle, CircleCheck, MoreHorizontal, Pencil, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Appointment } from './appointments-table';
import { AppointmentDeleteDialog } from './modals/appointment-delete-dialog';
import { AppointmentEditDialog } from './modals/appointment-edit-dialog';
import { AppointmentStatusDialog } from './modals/appointment-status-dialog';

interface AppointmentActionsMenuProps {
  appointment: Appointment;
}

export function AppointmentActionsMenu({ appointment }: AppointmentActionsMenuProps) {
  const { t } = useTranslation();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>(
    'CONFIRMED',
  );

  const canConfirm = appointment.status === 'PENDING';
  const canComplete = appointment.status === 'CONFIRMED';
  const canCancel = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';

  const handleStatusAction = (status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    setTargetStatus(status);
    setStatusDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('appointments.openMenu', 'Open appointment menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('appointments.edit', 'Edit')}
          </DropdownMenuItem>
          {canConfirm && (
            <DropdownMenuItem onClick={() => handleStatusAction('CONFIRMED')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('appointments.confirm', 'Confirm')}
            </DropdownMenuItem>
          )}
          {canComplete && (
            <DropdownMenuItem onClick={() => handleStatusAction('COMPLETED')}>
              <CircleCheck className="mr-2 h-4 w-4" />
              {t('appointments.complete', 'Complete')}
            </DropdownMenuItem>
          )}
          {canCancel && (
            <DropdownMenuItem variant="destructive" onClick={() => handleStatusAction('CANCELLED')}>
              <XCircle className="mr-2 h-4 w-4" />
              {t('appointments.cancel', 'Cancel')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('appointments.delete', 'Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AppointmentStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        appointment={appointment}
        targetStatus={targetStatus}
      />

      <AppointmentEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        appointment={appointment}
      />

      <AppointmentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        appointment={appointment}
      />
    </>
  );
}
