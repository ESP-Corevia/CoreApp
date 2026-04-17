import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type Moment = 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
const MOMENTS: Moment[] = ['MORNING', 'NOON', 'EVENING', 'BEDTIME', 'CUSTOM'];

export interface ScheduleFormValue {
  intakeTime: string;
  intakeMoment: Moment;
  quantity: string;
  unit: string;
  notes: string;
}

interface ScheduleFormProps {
  initial?: Partial<ScheduleFormValue>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (value: ScheduleFormValue) => void;
  onCancel: () => void;
  idPrefix?: string;
}

export function ScheduleForm({
  initial,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
  idPrefix = 'sched',
}: ScheduleFormProps) {
  const { t } = useTranslation();
  const [intakeTime, setIntakeTime] = useState(initial?.intakeTime ?? '08:00');
  const [intakeMoment, setIntakeMoment] = useState<Moment>(initial?.intakeMoment ?? 'MORNING');
  const [quantity, setQuantity] = useState(initial?.quantity ?? '1');
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  useEffect(() => {
    setIntakeTime(initial?.intakeTime ?? '08:00');
    setIntakeMoment(initial?.intakeMoment ?? 'MORNING');
    setQuantity(initial?.quantity ?? '1');
    setUnit(initial?.unit ?? '');
    setNotes(initial?.notes ?? '');
  }, [
    initial?.intakeTime,
    initial?.intakeMoment,
    initial?.quantity,
    initial?.unit,
    initial?.notes,
  ]);

  const submit = () => {
    onSubmit({
      intakeTime,
      intakeMoment,
      quantity: quantity.trim() || '1',
      unit: unit.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-time`}>{t('patient.pillbox.form.time')}</Label>
          <Input
            id={`${idPrefix}-time`}
            type="time"
            value={intakeTime}
            onChange={e => setIntakeTime(e.target.value)}
            className="tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-moment`}>{t('patient.pillbox.form.moment')}</Label>
          <Select value={intakeMoment} onValueChange={v => setIntakeMoment(v as Moment)}>
            <SelectTrigger id={`${idPrefix}-moment`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOMENTS.map(m => (
                <SelectItem key={m} value={m}>
                  {t(`patient.pillbox.moment.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-qty`}>{t('patient.pillbox.form.quantity')}</Label>
          <Input
            id={`${idPrefix}-qty`}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="1"
            inputMode="decimal"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-unit`}>{t('patient.pillbox.form.unit')}</Label>
          <Input
            id={`${idPrefix}-unit`}
            value={unit}
            onChange={e => setUnit(e.target.value)}
            placeholder={t('patient.pillbox.form.unitPlaceholder')}
            maxLength={30}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-notes`}>{t('patient.pillbox.detail.notes')}</Label>
        <Input
          id={`${idPrefix}-notes`}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t('patient.pillbox.detail.notesPlaceholder')}
          maxLength={200}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? t('common.loading') : submitLabel}
        </Button>
      </div>
    </div>
  );
}
