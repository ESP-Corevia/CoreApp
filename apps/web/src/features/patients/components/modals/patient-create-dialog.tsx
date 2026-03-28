import { useForm } from '@tanstack/react-form';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { useCreatePatient } from '@/queries';

export function PatientCreateDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const mutation = useCreatePatient();

  const schema = z.object({
    userId: z.uuid(t('patients.form.userIdInvalid', 'Must be a valid UUID')),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    gender: z.enum(['MALE', 'FEMALE']),
  });

  const form = useForm({
    defaultValues: {
      userId: '',
      dateOfBirth: '',
      gender: 'MALE' as string,
    },
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(
        {
          userId: value.userId,
          dateOfBirth: value.dateOfBirth,
          gender: value.gender as 'MALE' | 'FEMALE',
        },
        { onSuccess: () => setOpen(false) },
      );
    },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          <Trans i18nKey="patients.createPatient">Create Patient</Trans>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="patients.createDialog.title">Create Patient Profile</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans i18nKey="patients.createDialog.description">
              Enter the user UUID and patient details. The user must already have the role
              "patient".
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
          <form.Field name="userId">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="patients.form.userId">User UUID</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="font-mono text-sm"
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
            <form.Field name="dateOfBirth">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    <Trans i18nKey="patients.form.dateOfBirth">Date of Birth</Trans>
                  </Label>
                  <Input
                    id={field.name}
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

            <form.Field name="gender">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    <Trans i18nKey="patients.form.gender">Gender</Trans>
                  </Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  <Trans i18nKey="common.cancel">Cancel</Trans>
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting
                    ? t('patients.creating', 'Creating...')
                    : t('patients.createProfile', 'Create Patient Profile')}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
