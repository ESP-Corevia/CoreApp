import { Calendar as CalendarIcon, Clock, Sun, Sunset } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
  const today = new Date().toISOString().split('T')[0];

  const { morning, afternoon } = useMemo(() => {
    const m: string[] = [];
    const a: string[] = [];
    for (const slot of slots) {
      const hour = Number.parseInt(slot.slice(0, 2), 10);
      if (hour < 12) m.push(slot);
      else a.push(slot);
    }
    return { morning: m, afternoon: a };
  }, [slots]);

  const renderSlotGroup = (group: string[], label: string, Icon: typeof Sun) => {
    if (group.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
          <Icon className="size-3.5" aria-hidden="true" />
          <span>{label}</span>
          <span className="ml-auto tabular-nums">{group.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {group.map(slot => {
            const active = selectedSlot === slot;
            return (
              <Button
                key={slot}
                type="button"
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectSlot(slot)}
                aria-pressed={active}
                className={cn(
                  'h-10 font-medium tabular-nums transition-all',
                  active && 'shadow-sm',
                  !active && 'hover:border-primary/40 hover:bg-primary/5',
                )}
              >
                {slot}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="slot-date" className="flex items-center gap-1.5">
          <CalendarIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          {t('patient.doctors.bookingSteps.date')}
        </Label>
        <Input
          id="slot-date"
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
          min={today}
          className="h-10"
        />
      </div>

      {date && (
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {t('patient.doctors.bookingSteps.slot')}
          </Label>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1].map(g => (
                <div key={g} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 rounded-md" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed p-6 text-center">
              <Clock className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium text-sm">{t('patient.doctors.noSlots')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderSlotGroup(morning, t('patient.doctors.morning'), Sun)}
              {renderSlotGroup(afternoon, t('patient.doctors.afternoon'), Sunset)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
