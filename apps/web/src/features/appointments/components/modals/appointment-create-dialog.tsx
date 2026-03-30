import { useForm } from '@tanstack/react-form';
import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
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
  DialogTrigger,
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
import { useCreateAppointment } from '@/queries';

const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
];

export function AppointmentCreateDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const mutation = useCreateAppointment();

  const createSchema = z.object({
    doctorId: z.uuid(t('appointments.form.doctorIdRequired', 'Valid doctor ID is required')),
    patientId: z.uuid(t('appointments.form.patientIdRequired', 'Valid patient ID is required')),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t('appointments.form.dateFormat', 'Date must be YYYY-MM-DD')),
    time: z.string().min(1, t('appointments.form.timeRequired', 'Time is required')),
    reason: z.string(),
  });

  const form = useForm({
    defaultValues: {
      doctorId: '',
      patientId: '',
      date: '',
      time: '',
      reason: '',
    },
    validators: {
      onChange: createSchema,
      onSubmit: createSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(
        {
          doctorId: value.doctorId,
          patientId: value.patientId,
          date: value.date,
          time: value.time,
          reason: value.reason || undefined,
        },
        {
          onSuccess: () => {
            setOpen(false);
            form.reset();
          },
        },
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          <Trans i18nKey="appointments.create">Create Appointment</Trans>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="appointments.createDialog.title">New Appointment</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans i18nKey="appointments.createDialog.description">
              Create a new appointment for a patient with a doctor.
            </Trans>
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
          <form.Field name="doctorId">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="appointments.form.doctorId">Doctor ID</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('appointments.form.doctorIdPlaceholder', 'Enter doctor UUID')}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="patientId">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="appointments.form.patientId">Patient ID</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('appointments.form.patientIdPlaceholder', 'Enter patient UUID')}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

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
                      <SelectValue placeholder={t('appointments.form.selectTime', 'Select time')} />
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
                  placeholder={t(
                    'appointments.form.reasonPlaceholder',
                    'Reason for the appointment (optional)',
                  )}
                  rows={3}
                />
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
                    setOpen(false);
                    form.reset();
                  }}
                  disabled={isSubmitting}
                >
                  <Trans i18nKey="common.cancel">Cancel</Trans>
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting
                    ? t('appointments.creating', 'Creating...')
                    : t('appointments.create', 'Create Appointment')}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
