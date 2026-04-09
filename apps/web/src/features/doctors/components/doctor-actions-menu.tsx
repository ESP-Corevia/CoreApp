import { BadgeCheck, BadgeX, MoreHorizontal, Pencil } from 'lucide-react';
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
import { useSetDoctorVerified } from '@/queries';

import type { Doctor } from './doctors-table';
import { DoctorEditDialog } from './modals/doctor-edit-dialog';

interface DoctorActionsMenuProps {
  doctor: Doctor;
}

export function DoctorActionsMenu({ doctor }: DoctorActionsMenuProps) {
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const setVerified = useSetDoctorVerified();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('doctors.openMenu', 'Open doctor menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('doctors.edit', 'Edit Profile')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {doctor.verified ? (
            <DropdownMenuItem
              onClick={() => {
                if (doctor.userId) {
                  setVerified.mutate({ userId: doctor.userId, verified: false });
                }
              }}
              disabled={!doctor.userId || setVerified.isPending}
            >
              <BadgeX className="mr-2 h-4 w-4" />
              {t('doctors.unverify', 'Unverify')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                if (doctor.userId) {
                  setVerified.mutate({ userId: doctor.userId, verified: true });
                }
              }}
              disabled={!doctor.userId || setVerified.isPending}
            >
              <BadgeCheck className="mr-2 h-4 w-4" />
              {t('doctors.verify', 'Verify')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DoctorEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} doctor={doctor} />
    </>
  );
}
