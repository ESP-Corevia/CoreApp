import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BookingFormProps {
  doctorName: string;
  date: string;
  time: string;
  onSubmit: (reason?: string) => void;
  isPending: boolean;
}

export function BookingForm({ doctorName, date, time, onSubmit, isPending }: BookingFormProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="font-medium text-sm">{t('patient.doctors.bookWith', { name: doctorName })}</p>
        <p className="text-muted-foreground text-xs">
          {new Date(date).toLocaleDateString()} &mdash; {time}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Input
          id="reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Brief description..."
        />
      </div>

      <Button className="w-full" onClick={() => onSubmit(reason || undefined)} disabled={isPending}>
        {isPending ? t('common.loading') : t('patient.doctors.confirmBooking')}
      </Button>
    </div>
  );
}
