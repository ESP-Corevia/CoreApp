import { AlertTriangle } from 'lucide-react';
import { Trans } from 'react-i18next';

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
import { useDeleteUser } from '@/queries';
import type { User } from '@/types/data-table';

interface DeleteUserDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const deleteMutation = useDeleteUser();

  const handleDelete = () => {
    deleteMutation.mutate(user.id, {
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
            <AlertTriangle className="text-destructive h-5 w-5" />
            <Trans i18nKey="userDeleteModal.title">Delete User</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans
              i18nKey="userDeleteModal.description"
              defaults="Are you sure you want to delete <strong>{{name}}</strong> ? This action cannot be undone and will permanently remove the user and all their data."
              values={{ name: user.name ?? user.email }}
              components={{
                strong: <span className="font-semibold" />,
              }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Trans i18nKey="userDeleteModal.cancel">Cancel</Trans>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <Trans i18nKey="userDeleteModal.deleting">Deleting...</Trans>
            ) : (
              <Trans i18nKey="userDeleteModal.delete">Delete</Trans>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
