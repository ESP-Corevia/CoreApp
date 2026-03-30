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
import { useUpdateDoctor } from '@/queries';

import type { Doctor } from '../doctors-table';

interface DoctorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor;
}

export function DoctorEditDialog({ open, onOpenChange, doctor }: DoctorEditDialogProps) {
  const { t } = useTranslation();
  const mutation = useUpdateDoctor();

  const editSchema = z.object({
    specialty: z.string().min(1, t('doctors.form.specialtyRequired', 'Specialty is required')),
    address: z.string().min(1, t('doctors.form.addressRequired', 'Address is required')),
    city: z.string().min(1, t('doctors.form.cityRequired', 'City is required')),
  });

  const form = useForm({
    defaultValues: {
      specialty: doctor.specialty,
      address: doctor.address,
      city: doctor.city,
    },
    validators: {
      onChange: editSchema,
      onSubmit: editSchema,
    },
    onSubmit: async ({ value }) => {
      if (!doctor.userId) return;
      mutation.mutate(
        {
          userId: doctor.userId,
          specialty: value.specialty,
          address: value.address,
          city: value.city,
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
            <Trans i18nKey="doctors.editDialog.title">Edit Doctor Profile</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="doctors.editDialog.description"
              defaults="Update profile for {{name}}."
              values={{ name: doctor.name ?? 'Unknown' }}
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
          <form.Field name="specialty">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="doctors.form.specialty">Specialty</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
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

          <form.Field name="address">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="doctors.form.address">Address</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
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

          <form.Field name="city">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="doctors.form.city">City</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
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
                    ? t('doctors.saving', 'Saving...')
                    : t('doctors.save', 'Save Changes')}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
