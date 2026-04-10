import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface SlotPickerProps {
  date: string;
  onDateChange: (date: string) => void;
  slots: string[];
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  isLoading: boolean;
}

export function SlotPicker({
  date,
  onDateChange,
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading,
}: SlotPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('patient.doctors.selectDate')}</Label>
        <Input
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {date && (
        <div className="space-y-2">
          <Label>{t('patient.doctors.availableSlots')}</Label>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('patient.doctors.noSlots')}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map(slot => (
                <Button
                  key={slot}
                  variant={selectedSlot === slot ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSelectSlot(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
