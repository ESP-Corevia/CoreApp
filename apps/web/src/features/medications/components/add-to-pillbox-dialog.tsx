import { useForm } from '@tanstack/react-form';

import { CalendarDays, Clock, Loader2, Plus, Trash2, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import MedicationFormIcon from '@/components/medication-form-icon';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { getIntakeMomentLabel, INTAKE_MOMENT_KEYS } from '@/features/pillbox/lib/moment-label';
import { useAdminCreateMedication } from '@/queries';

import type { MedicationData } from './medication-card';

interface AddToPillboxDialogProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void;
  medication: MedicationData;
}

const DEFAULT_TIMES: Record<string, string> = {
  MORNING: '08:00',
  NOON: '12:00',
  EVENING: '19:00',
  BEDTIME: '22:00',
  CUSTOM: '12:00',
};

interface ScheduleEntry {
  intakeTime: string;
  intakeMoment: string;
  quantity: string;
  unit: string;
}

function createEmptySchedule(): ScheduleEntry {
  return {
    intakeTime: '08:00',
    intakeMoment: 'MORNING',
    quantity: '1',
    unit: 'comprimé',
  };
}

export default function AddToPillboxDialog({
  open,
  onOpenChange,
  medication,
}: AddToPillboxDialogProps) {
  const { t } = useTranslation();
  const today = new Date().toISOString().split('T')[0];
  const createMutation = useAdminCreateMedication();

  const form = useForm({
    defaultValues: {
      patientId: '',
      dosageLabel: '',
      instructions: '',
      startDate: today,
      endDate: '',
      schedules: [createEmptySchedule()] as ScheduleEntry[],
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        patientId: value.patientId.trim(),
        medicationExternalId: medication.externalId ?? null,
        source: 'api-medicaments-fr' as const,
        cis: medication.cis ?? null,
        cip: medication.cip ?? null,
        medicationName: medication.name,
        medicationForm: medication.form ?? null,
        activeSubstances: medication.activeSubstances,
        dosageLabel: value.dosageLabel || null,
        instructions: value.instructions || null,
        startDate: value.startDate,
        endDate: value.endDate || null,
        schedules: value.schedules.map(s => ({
          intakeTime: s.intakeTime,
          intakeMoment: s.intakeMoment as 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM',
          quantity: s.quantity || '1',
          unit: s.unit || null,
        })),
      });
      form.reset();
      onOpenChange(false);
    },
  });

  const handleScheduleChange = (index: number, field: keyof ScheduleEntry, value: string) => {
    form.setFieldValue('schedules', prev =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const updated = { ...s, [field]: value };
        if (field === 'intakeMoment' && value in DEFAULT_TIMES) {
          updated.intakeTime = DEFAULT_TIMES[value]!;
        }
        return updated;
      }),
    );
  };

  const handleAddSchedule = () => {
    form.setFieldValue('schedules', prev => [...prev, createEmptySchedule()]);
  };

  const handleRemoveSchedule = (index: number) => {
    form.setFieldValue('schedules', prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MedicationFormIcon iconKey={medication.iconKey} size="md" />
            {t('medications.addToPillbox', 'Ajouter au pilulier')}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-medium text-foreground">{medication.name}</span>
            {medication.form && <span className="text-muted-foreground">— {medication.form}</span>}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async e => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="space-y-5"
        >
          {/* Patient ID */}
          <form.Field
            name="patientId"
            validators={{
              onSubmit: ({ value }) =>
                !value.trim()
                  ? t('pillbox.patientIdRequired', "L'identifiant du patient est requis")
                  : undefined,
            }}
          >
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" />
                  {t('pillbox.patientId', 'Patient')}
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('pillbox.patientIdPlaceholder', 'UUID du patient')}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors.map(error => (
                  <p key={String(error)} className="text-destructive text-sm">
                    {String(error)}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Dosage */}
          <form.Field name="dosageLabel">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{t('pillbox.dosageLabel', 'Posologie')}</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder="ex: 500mg"
                />
              </div>
            )}
          </form.Field>

          {/* Instructions */}
          <form.Field name="instructions">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{t('pillbox.instructions', 'Instructions')}</Label>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder="ex: Prendre au cours du repas"
                  rows={2}
                />
              </div>
            )}
          </form.Field>

          {/* Dates */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {t('pillbox.dates', 'Période de traitement')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="startDate"
                validators={{
                  onSubmit: ({ value }) =>
                    !value
                      ? t('pillbox.startDateRequired', 'La date de début est requise')
                      : undefined,
                }}
              >
                {field => (
                  <div className="space-y-1">
                    <Label htmlFor={field.name} className="text-muted-foreground text-xs">
                      {t('pillbox.startDate', 'Date de début')}
                    </Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.map(error => (
                      <p key={String(error)} className="text-destructive text-xs">
                        {String(error)}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
              <form.Field
                name="endDate"
                validators={{
                  onSubmit: ({ value, fieldApi }) => {
                    if (!value) return undefined;
                    const start = fieldApi.form.getFieldValue('startDate');
                    return start && value < start
                      ? t(
                          'pillbox.endDateBeforeStart',
                          'La date de fin doit être après la date de début',
                        )
                      : undefined;
                  },
                }}
              >
                {field => (
                  <div className="space-y-1">
                    <Label htmlFor={field.name} className="text-muted-foreground text-xs">
                      {t('pillbox.endDate', 'Date de fin')}
                    </Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={e => field.handleChange(e.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.map(error => (
                      <p key={String(error)} className="text-destructive text-xs">
                        {String(error)}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          <Separator />

          {/* Schedules */}
          <form.Field name="schedules">
            {field => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-base">
                    <Clock className="h-4 w-4" />
                    {t('pillbox.schedules', 'Rappels de prise')}
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddSchedule}>
                    <Plus className="mr-1 h-4 w-4" />
                    {t('pillbox.addSchedule', 'Ajouter')}
                  </Button>
                </div>

                {field.state.value.map((schedule, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={index} className="space-y-3 rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground text-sm">
                        {t('pillbox.scheduleNumber', 'Prise {{number}}', {
                          number: index + 1,
                        })}
                      </span>
                      {field.state.value.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveSchedule(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Intake moment */}
                      <div className="space-y-1">
                        <Label className="text-xs">{t('pillbox.intakeMoment', 'Moment')}</Label>
                        <Select
                          value={schedule.intakeMoment}
                          onValueChange={value =>
                            handleScheduleChange(index, 'intakeMoment', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INTAKE_MOMENT_KEYS.map(key => (
                              <SelectItem key={key} value={key}>
                                {getIntakeMomentLabel(t, key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Intake time */}
                      <div className="space-y-1">
                        <Label className="text-xs">{t('pillbox.intakeTime', 'Heure')}</Label>
                        <Input
                          type="time"
                          value={schedule.intakeTime}
                          onChange={e => handleScheduleChange(index, 'intakeTime', e.target.value)}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1">
                        <Label className="text-xs">{t('pillbox.quantity', 'Quantité')}</Label>
                        <Input
                          value={schedule.quantity}
                          onChange={e => handleScheduleChange(index, 'quantity', e.target.value)}
                          placeholder="1"
                        />
                      </div>

                      {/* Unit */}
                      <div className="space-y-1">
                        <Label className="text-xs">{t('pillbox.unit', 'Unité')}</Label>
                        <Input
                          value={schedule.unit}
                          onChange={e => handleScheduleChange(index, 'unit', e.target.value)}
                          placeholder="comprimé"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form.Field>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.state.isSubmitting}
            >
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('pillbox.addMedication', 'Ajouter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
