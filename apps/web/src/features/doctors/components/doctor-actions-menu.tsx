import { MoreHorizontal, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Doctor } from './doctors-table';
import { DoctorEditDialog } from './modals/doctor-edit-dialog';

interface DoctorActionsMenuProps {
  doctor: Doctor;
}

export function DoctorActionsMenu({ doctor }: DoctorActionsMenuProps) {
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
        </DropdownMenuContent>
      </DropdownMenu>

      <DoctorEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} doctor={doctor} />
    </>
  );
}
