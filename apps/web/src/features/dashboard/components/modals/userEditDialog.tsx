import { useEffect } from 'react';

import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import { useTranslation, Trans } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';
import type { User } from '@/types/data-table';

interface EditUserDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const { t } = useTranslation();

  const editUserSchema = z.object({
    email: z.email(t('profile.emailInvalid', 'Invalid email address')),
    name: z.string().min(3, t('profile.nameMin', 'Name must be at least 3 characters')),
    role: z.enum(['admin', 'user']),
  });
  const queryClient = useQueryClient();
  const trpc = useTrpc();
  const form = useForm({
    defaultValues: {
      name: user.name,
      email: user.email,
      role: (user.role ?? 'user') as 'admin' | 'user',
    },
    validators: {
      onChange: editUserSchema,
      onSubmit: editUserSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (value.role !== user.role) {
          await authClient.admin.setRole({
            userId: user.id,
            role: value.role,
          });
        }
        await authClient.admin.updateUser({
          userId: user.id,
          data: { name: value.name },
        });
        toast.success(t('userEditModal.success', 'User updated successfully'));
        void queryClient.invalidateQueries(trpc.admin.listUsers.queryFilter());
        onOpenChange(false);
      } catch (error) {
        toast.error(
          t('userEditModal.error', 'Failed to update user: {{message}}', {
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        );
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="userEditModal.editUser">Edit User</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans i18nKey="userEditModal.description">Update user information and role.</Trans>
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async e => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="space-y-4 py-4"
        >
          <form.Field name="name">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="profile.name">Name</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('profile.nameLabel', 'Enter your name')}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">
              <Trans i18nKey="profile.email">Email</Trans>
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              placeholder="user@example.com"
              disabled
            />
            <p className="text-muted-foreground text-sm">
              <Trans i18nKey="userEditModal.emailCannotBeChanged">
                Email cannot be changed here
              </Trans>
            </p>
          </div>

          {/* Role Field */}
          <form.Field name="role">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="userEditModal.roleLabel">Role</Trans>
                </Label>
                <Select
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value as 'admin' | 'user')}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Form Actions */}
          <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting, state.isDirty]}>
            {([canSubmit, isSubmitting, isDirty]) => (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  <Trans i18nKey="userEditModal.cancel">Cancel</Trans>
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting || !isDirty}>
                  {isSubmitting
                    ? t('userEditModal.saving', 'Saving...')
                    : t('userEditModal.saveChanges', 'Save Changes')}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
