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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';
import type { User } from '@/types/data-table';

interface BanUserDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function BanUserDialog({ open, onOpenChange, user }: BanUserDialogProps) {
  const { t } = useTranslation();
  const trpc = useTrpc();
  const BAN_DURATIONS = [
    { label: t('banUserDialog.durations.1Hour', '1 Hour'), value: 3600 },
    { label: t('banUserDialog.durations.1Day', '1 Day'), value: 86400 },
    { label: t('banUserDialog.durations.7Days', '7 Days'), value: 604800 },
    { label: t('banUserDialog.durations.30Days', '30 Days'), value: 2592000 },
    { label: t('banUserDialog.durations.Permanent', 'Permanent'), value: 0 },
  ] as const;

  const banUserSchema = z.object({
    reason: z
      .string()
      .min(3, t('banUserDialog.errors.reasonTooShort', 'Reason must be at least 3 characters')),
    duration: z.number(),
  });
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      reason: '',
      duration: BAN_DURATIONS[1].value as number,
    },
    validators: {
      onChange: banUserSchema,
      onSubmit: banUserSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.admin.banUser({
          userId: user.id,
          banReason: value.reason,
          banExpiresIn: value.duration,
        });

        toast.success(
          t('banUserDialog.success', '{{name}} has been banned', { name: user.name ?? user.email })
        );
        void queryClient.invalidateQueries(trpc.admin.listUsers.queryFilter());
        onOpenChange(false);
        form.reset();
      } catch (error) {
        toast.error(
          t('banUserDialog.error', 'Failed to ban user: {{message}}', {
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
            <Trans i18nKey="banUserDialog.title">Ban User</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="banUserDialog.description"
              values={{ name: user.name ?? user.email }}
              defaults="Ban {{ name }} from accessing the application."
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
          {/* Reason Field */}
          <form.Field name="reason">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="banUserDialog.reasonLabel">Reason for ban</Trans>
                </Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('banUserDialog.reasonPlaceholder', 'Enter reason for ban...')}
                  className="min-h-[100px]"
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Duration Field */}
          <form.Field name="duration">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="banUserDialog.durationLabel">Ban Duration</Trans>
                </Label>
                <Select
                  value={field.state.value.toString()}
                  onValueChange={v => field.handleChange(Number(v))}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BAN_DURATIONS.map(d => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
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
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
                    <Trans i18nKey="banUserDialog.banning">Banning...</Trans>
                  ) : (
                    <Trans i18nKey="banUserDialog.banUser">Ban User</Trans>
                  )}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
