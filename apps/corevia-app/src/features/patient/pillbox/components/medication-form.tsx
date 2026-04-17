import { useState } from 'react';
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

type Moment = 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';

const MOMENTS: Moment[] = ['MORNING', 'NOON', 'EVENING', 'BEDTIME', 'CUSTOM'];

interface MedicationFormProps {
  onSubmit: (data: {
    medicationName: string;
    dosageLabel?: string;
    instructions?: string;
    schedules: Array<{
      intakeTime: string;
      intakeMoment?: Moment;
      quantity?: string;
    }>;
  }) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function MedicationForm({ onSubmit, isPending, onCancel }: MedicationFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [intakeTime, setIntakeTime] = useState('08:00');
  const [quantity, setQuantity] = useState('1');
  const [moment, setMoment] = useState<Moment>('MORNING');
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return;
    onSubmit({
      medicationName: name.trim(),
      dosageLabel: dosage.trim() || undefined,
      instructions: instructions.trim() || undefined,
      schedules: [
        {
          intakeTime,
          intakeMoment: moment,
          quantity: quantity || undefined,
        },
      ],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="med-name">
          {t('patient.pillbox.form.name')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="med-name"
          value={name}
          onChange={e => setName(e.target.value)}
          aria-invalid={nameError || undefined}
          aria-describedby={nameError ? 'med-name-error' : undefined}
          required
        />
        {nameError && (
          <p id="med-name-error" className="text-destructive text-xs">
            {t('patient.pillbox.form.nameRequired')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="med-dosage">{t('patient.pillbox.form.dosage')}</Label>
          <Input
            id="med-dosage"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            placeholder={t('patient.pillbox.form.dosagePlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="med-qty">{t('patient.pillbox.form.quantity')}</Label>
          <Input
            id="med-qty"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="1"
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="med-instructions">{t('patient.pillbox.form.instructions')}</Label>
        <Input
          id="med-instructions"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder={t('patient.pillbox.form.instructionsPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="med-time">{t('patient.pillbox.form.time')}</Label>
          <Input
            id="med-time"
            type="time"
            value={intakeTime}
            onChange={e => setIntakeTime(e.target.value)}
            className="tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="med-moment">{t('patient.pillbox.form.moment')}</Label>
          <Select value={moment} onValueChange={v => setMoment(v as Moment)}>
            <SelectTrigger id="med-moment">
              <SelectValue placeholder={t('patient.pillbox.form.momentSelect')} />
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

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
