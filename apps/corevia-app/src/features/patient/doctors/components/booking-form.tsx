import { CalendarCheck, CalendarDays, Clock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BookingFormProps {
  doctorName?: string;
  date: string;
  time: string;
  onSubmit: (reason?: string) => void;
  isPending: boolean;
}

export function BookingForm({ doctorName, date, time, onSubmit, isPending }: BookingFormProps) {
  const { t, i18n } = useTranslation();
  const [reason, setReason] = useState('');

  const longDate = date
    ? new Intl.DateTimeFormat(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${date}T00:00:00`))
    : '';

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4 md:p-5">
      <div className="space-y-1">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t('patient.doctors.bookingSteps.confirm')}
        </p>
        {doctorName && (
          <p className="font-semibold text-sm">
            {t('patient.doctors.bookWith', { name: doctorName })}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-2 border-y py-3 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <dt className="sr-only">Date</dt>
            <dd className="font-medium text-sm">{longDate}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <dt className="sr-only">Time</dt>
            <dd className="font-medium text-sm tabular-nums">{time}</dd>
          </div>
        </div>
      </dl>

      <div className="space-y-1.5">
        <Label htmlFor="booking-reason">{t('patient.doctors.reasonOptional')}</Label>
        <Input
          id="booking-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={t('patient.doctors.reasonPlaceholder')}
          maxLength={200}
          className="bg-background"
        />
      </div>

      <Button
        className="w-full"
        onClick={() => onSubmit(reason.trim() || undefined)}
        disabled={isPending}
      >
        <CalendarCheck className="size-4" aria-hidden="true" />
        {isPending ? t('common.loading') : t('patient.doctors.confirmBooking')}
      </Button>
    </div>
  );
}
