import { useState } from 'react';

import { CheckCircle, MoreHorizontal, XCircle, CircleCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { AppointmentStatusDialog } from './modals/appointment-status-dialog';

import type { Appointment } from './appointments-table';

interface AppointmentActionsMenuProps {
  appointment: Appointment;
}

export function AppointmentActionsMenu({ appointment }: AppointmentActionsMenuProps) {
  const { t } = useTranslation();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>(
    'CONFIRMED'
  );

  const canConfirm = appointment.status === 'PENDING';
  const canComplete = appointment.status === 'CONFIRMED';
  const canCancel = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';

  const handleStatusAction = (status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    setTargetStatus(status);
    setStatusDialogOpen(true);
  };

  if (!canConfirm && !canComplete && !canCancel) {
    return null;
  }

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
        </DropdownMenuContent>
      </DropdownMenu>

      <AppointmentStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        appointment={appointment}
        targetStatus={targetStatus}
      />
    </>
  );
}
