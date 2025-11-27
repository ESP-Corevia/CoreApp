import { useEffect, useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import { Eye, EyeOff } from 'lucide-react';
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
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';
import type { User } from '@/types/data-table';

interface SetPasswordDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function SetPasswordDialog({ open, onOpenChange, user }: SetPasswordDialogProps) {
  const trpc = useTrpc();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const queryClient = useQueryClient();
  const setPasswordSchema = z
    .object({
      newPassword: z
        .string()
        .min(8, t('profile.passwordMin', 'Password must be at least 8 characters'))
        .max(100, t('profile.passwordMax', 'Password must be at most 100 characters')),
      confirmPassword: z
        .string()
        .min(8, t('profile.confirmPasswordMin', 'Confirm password must be at least 8 characters'))
        .max(
          100,
          t('profile.confirmPasswordMax', 'Confirm password must be at most 100 characters')
        ),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: t('profile.passwordMismatch', 'Passwords do not match'),
      path: ['confirmPassword'],
    });
  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onChange: setPasswordSchema,
      onSubmit: setPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.admin.setUserPassword({
          userId: user.id,
          newPassword: value.newPassword,
        });

        toast.success(
          t('userSetPasswordModal.passwordUpdated.success', 'Password updated successfully')
        );
        void queryClient.invalidateQueries(trpc.admin.listUsers.queryFilter());
        onOpenChange(false);
        form.reset();
      } catch (error) {
        toast.error(
          t(
            'userSetPasswordModal.passwordUpdated.error',
            'Failed to update password: {{message}}',
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            }
          )
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
            <Trans i18nKey="userSetPasswordModal.title">Set Password</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="userSetPasswordModal.description"
              values={{ user: user.name ?? user.email }}
              defaults="Set a new password for <strong>{{user}}</strong>."
              components={{ strong: <span className="font-semibold" /> }}
            />
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
          <form.Field name="newPassword">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="userSetPasswordModal.newPassword">New Password</Trans>
                </Label>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t(
                      'userSetPasswordModal.newPasswordPlaceholder',
                      'Enter new password'
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? t('userSetPasswordModal.hidePassword', 'Hide password')
                        : t('userSetPasswordModal.showPassword', 'Show password')
                    }
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Confirm Password Field */}
          <form.Field
            name="confirmPassword"
            validators={{
              onChangeListenTo: ['newPassword'],
            }}
          >
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="userSetPasswordModal.confirmPassword">Confirm Password</Trans>
                </Label>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t(
                      'userSetPasswordModal.confirmPasswordPlaceholder',
                      'Confirm new password'
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword
                        ? t('userSetPasswordModal.hideConfirmedPassword', 'Hide confirmed password')
                        : t('userSetPasswordModal.showConfirmedPassword', 'Show confirmed password')
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    form.reset();
                  }}
                  disabled={isSubmitting}
                >
                  <Trans i18nKey="userSetPasswordModal.cancel">Cancel</Trans>
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting
                    ? t('userSetPasswordModal.setting', 'Setting...')
                    : t('userSetPasswordModal.setPassword', 'Set Password')}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
