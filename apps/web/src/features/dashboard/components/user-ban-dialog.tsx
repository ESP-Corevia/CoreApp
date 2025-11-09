import { useEffect } from 'react';

import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

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

import { adminQueryKeys } from '../../../queries';

import type { User } from './table';

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

const BAN_DURATIONS = [
  { label: '1 Hour', value: 3600 },
  { label: '1 Day', value: 86400 },
  { label: '7 Days', value: 604800 },
  { label: '30 Days', value: 2592000 },
  { label: 'Permanent', value: 0 },
] as const;

const banUserSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  duration: z.number(),
});

export function BanUserDialog({ open, onOpenChange, user }: BanUserDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      reason: '',
      duration: 86400, // 1 day default
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

        toast.success(`${user.name || user.email} has been banned`);
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
        onOpenChange(false);
        form.reset();
      } catch (error) {
        console.error('Failed to ban user:', error);
        toast.error(
          `Failed to ban user: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            Ban {user.name || user.email} from accessing the application.
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
                <Label htmlFor={field.name}>Reason</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder="Enter reason for ban..."
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
                <Label htmlFor={field.name}>Duration</Label>
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
                  {isSubmitting ? 'Banning...' : 'Ban User'}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
