import { useState } from 'react';

import { Ban, Key, MoreHorizontal, Shield, Trash2, UserCog, UserX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useImpersonateUser, useUnbanUser } from '../../../queries';

import { BanUserDialog } from './user-ban-dialog';
import { DeleteUserDialog } from './user-delete-dialog';
import { EditUserDialog } from './user-edit-dialog';
import { SetPasswordDialog } from './user-set-password-dialog';

import type { User } from './table';

interface UserActionsMenuProps {
  user: User;
}

export function UserActionsMenu({ user }: UserActionsMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const unbanMutation = useUnbanUser();
  const impersonateMutation = useImpersonateUser();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <UserCog className="mr-2 h-4 w-4" />
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            Set Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => impersonateMutation.mutate(user.id)}>
            <Shield className="mr-2 h-4 w-4" />
            Impersonate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem onClick={() => unbanMutation.mutate(user.id)}>
              <UserX className="mr-2 h-4 w-4" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBanOpen(true)}>
              <Ban className="mr-2 h-4 w-4" />
              Ban User
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <EditUserDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
      <DeleteUserDialog open={deleteOpen} onOpenChange={setDeleteOpen} user={user} />
      <BanUserDialog open={banOpen} onOpenChange={setBanOpen} user={user} />
      <SetPasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} user={user} />
    </>
  );
}
