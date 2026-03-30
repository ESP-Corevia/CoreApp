import { useForm } from '@tanstack/react-form';
import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

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
import { useUpdatePatient } from '@/queries';

import type { Patient } from '../patients-table';

interface PatientEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

export function PatientEditDialog({ open, onOpenChange, patient }: PatientEditDialogProps) {
  const { t } = useTranslation();
  const mutation = useUpdatePatient();

  const form = useForm({
    defaultValues: {
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender as 'MALE' | 'FEMALE',
      phone: patient.phone ?? '',
      address: patient.patientAddress ?? '',
      bloodType: patient.bloodType ?? '',
      allergies: patient.allergies ?? '',
      emergencyContactName: patient.emergencyContactName ?? '',
      emergencyContactPhone: patient.emergencyContactPhone ?? '',
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(
        {
          userId: patient.userId,
          dateOfBirth: value.dateOfBirth,
          gender: value.gender,
          phone: value.phone || null,
          address: value.address || null,
          bloodType: (value.bloodType || null) as
            | 'A+'
            | 'A-'
            | 'B+'
            | 'B-'
            | 'AB+'
            | 'AB-'
            | 'O+'
            | 'O-'
            | null,
          allergies: value.allergies || null,
          emergencyContactName: value.emergencyContactName || null,
          emergencyContactPhone: value.emergencyContactPhone || null,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="patients.editDialog.title">Edit Patient Profile</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="patients.editDialog.description"
              defaults="Update profile for {{name}}."
              values={{ name: patient.name }}
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
            <form.Field name="dateOfBirth">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    {t('patients.form.dateOfBirth', 'Date of Birth')}
                  </Label>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="gender">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{t('patients.form.gender', 'Gender')}</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={v => field.handleChange(v as 'MALE' | 'FEMALE')}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">{t('patients.form.male', 'Male')}</SelectItem>
                      <SelectItem value="FEMALE">{t('patients.form.female', 'Female')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="phone">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{t('patients.form.phone', 'Phone')}</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="bloodType">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{t('patients.form.bloodType', 'Blood Type')}</Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="address">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{t('patients.form.address', 'Address')}</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="allergies">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{t('patients.form.allergies', 'Allergies')}</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="emergencyContactName">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    {t('patients.form.emergencyContact', 'Emergency Contact')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('table.name', 'Name')}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="emergencyContactPhone">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    {t('patients.form.emergencyPhone', 'Emergency Phone')}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('patients.form.phone', 'Phone')}
                  />
                </div>
              )}
            </form.Field>
          </div>

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
                    ? t('patients.saving', 'Saving...')
                    : t('patients.save', 'Save Changes')}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
