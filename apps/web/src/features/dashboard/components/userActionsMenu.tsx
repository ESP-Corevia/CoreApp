import { useState } from 'react';

import { Ban, Key, MoreHorizontal, HatGlasses, Trash2, UserCog, UserX, Power } from 'lucide-react';
import { Trans } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useImpersonateUser, useUnbanUser, useRevokeUserSessions } from '@/queries';
import type { User } from '@/types/data-table';

import { BanUserDialog } from './modals/userBanDialog';
import { DeleteUserDialog } from './modals/userDeleteDialog';
import { EditUserDialog } from './modals/userEditDialog';
import { SetPasswordDialog } from './modals/userSetPasswordDialog';

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
  const revokeSessionsMutation = useRevokeUserSessions();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">
              <Trans i18nKey="UserActionsMenu.openUserMenu">Open user menu</Trans>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <UserCog className="mr-2 h-4 w-4" />
            <Trans i18nKey="UserActionsMenu.editUser">Edit User</Trans>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            <Trans i18nKey="UserActionsMenu.setPassword">Set Password</Trans>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => impersonateMutation.mutate(user.id)}
            disabled={user.banned === true}
          >
            <HatGlasses className="mr-2 h-4 w-4" />
            <Trans i18nKey="UserActionsMenu.impersonate">Impersonate</Trans>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem onClick={() => unbanMutation.mutate(user.id)}>
              <UserX className="mr-2 h-4 w-4" />
              <Trans i18nKey="UserActionsMenu.unbanUser">Unban User</Trans>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBanOpen(true)}>
              <Ban className="mr-2 h-4 w-4" />
              <Trans i18nKey="UserActionsMenu.banUser">Ban User</Trans>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <Trans i18nKey="UserActionsMenu.deleteUser">Delete User</Trans>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => revokeSessionsMutation.mutate(user.id)}
          >
            <Power className="mr-2 h-4 w-4" />
            <Trans i18nKey="UserActionsMenu.revokeSessions">Revoke all Sessions</Trans>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs  */}
      <EditUserDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
      <DeleteUserDialog open={deleteOpen} onOpenChange={setDeleteOpen} user={user} />
      <BanUserDialog open={banOpen} onOpenChange={setBanOpen} user={user} />
      <SetPasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} user={user} />
    </>
  );
}
