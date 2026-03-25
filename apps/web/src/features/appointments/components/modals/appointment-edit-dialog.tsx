import { useForm } from '@tanstack/react-form';
import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
import { Textarea } from '@/components/ui/textarea';
import { useUpdateAppointment } from '@/queries';

import type { Appointment } from '../appointments-table';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30',
];

interface AppointmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
}

export function AppointmentEditDialog({ open, onOpenChange, appointment }: AppointmentEditDialogProps) {
  const { t } = useTranslation();
  const mutation = useUpdateAppointment();

  const editSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('appointments.form.dateFormat', 'Date must be YYYY-MM-DD')),
    time: z.string().min(1, t('appointments.form.timeRequired', 'Time is required')),
    reason: z.string().optional(),
  });

  const form = useForm({
    defaultValues: {
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason ?? '',
    },
    validators: {
      onChange: editSchema,
      onSubmit: editSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(
        {
          id: appointment.id,
          date: value.date,
          time: value.time,
          reason: value.reason || undefined,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="appointments.editDialog.title">Edit Appointment</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="appointments.editDialog.description"
              defaults="Update appointment for {{patient}} with {{doctor}}."
              values={{
                patient: appointment.patientName ?? 'Unknown',
                doctor: appointment.doctorName ?? 'Unknown',
              }}
            />
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async e => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="space-y-4 py-2"
        >
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="date">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    <Trans i18nKey="appointments.form.date">Date</Trans>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map(error => (
                    <p key={error?.message} className="text-destructive text-sm">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="time">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    <Trans i18nKey="appointments.form.time">Time</Trans>
                  </Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
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
          </div>

          <form.Field name="reason">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="appointments.form.reason">Reason</Trans>
                </Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('appointments.form.reasonPlaceholder', 'Reason for the appointment (optional)')}
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting, state.isDirty]}>
            {([canSubmit, isSubmitting, isDirty]) => (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  <Trans i18nKey="common.cancel">Cancel</Trans>
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting || !isDirty}>
                  {isSubmitting
                    ? t('appointments.saving', 'Saving...')
                    : t('appointments.save', 'Save Changes')}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
