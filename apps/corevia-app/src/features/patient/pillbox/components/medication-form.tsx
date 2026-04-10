import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MedicationFormProps {
  onSubmit: (data: {
    medicationName: string;
    dosageLabel?: string;
    instructions?: string;
    schedules: Array<{
      intakeTime: string;
      intakeMoment?: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      medicationName: name.trim(),
      dosageLabel: dosage.trim() || undefined,
      instructions: instructions.trim() || undefined,
      schedules: [
        {
          intakeTime,
          quantity: quantity || undefined,
        },
      ],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('patient.pillbox.addMedication')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="med-name">Medication Name *</Label>
            <Input id="med-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="med-dosage">Dosage</Label>
            <Input
              id="med-dosage"
              value={dosage}
              onChange={e => setDosage(e.target.value)}
              placeholder="e.g. 500mg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="med-instructions">Instructions</Label>
            <Input
              id="med-instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Take with food"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="med-time">Schedule Time</Label>
              <Input
                id="med-time"
                type="time"
                value={intakeTime}
                onChange={e => setIntakeTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-qty">Quantity</Label>
              <Input
                id="med-qty"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending || !name.trim()} className="flex-1">
              {isPending ? t('common.loading') : t('common.save')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
