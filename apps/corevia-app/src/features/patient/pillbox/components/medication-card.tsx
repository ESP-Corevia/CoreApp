import { ChevronRight, PillBottle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MedicationCardProps {
  medication: {
    id: string;
    medicationName?: string;
    medicationForm?: string | null;
    dosageLabel?: string | null;
    instructions?: string | null;
    isActive?: boolean;
  };
}

export function MedicationCard({ medication }: MedicationCardProps) {
  const { t } = useTranslation();
  const isActive = medication.isActive !== false;
  const dosage = [medication.dosageLabel, medication.medicationForm].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/patient/pillbox/${medication.id}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={medication.medicationName}
    >
      <Card
        className={cn(
          'group transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
          !isActive && 'opacity-70',
        )}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl',
              isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}
            aria-hidden="true"
          >
            <PillBottle className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-sm" title={medication.medicationName}>
                {medication.medicationName ?? '—'}
              </p>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    isActive ? 'bg-emerald-500' : 'bg-muted-foreground/60',
                  )}
                  aria-hidden="true"
                />
                {isActive ? t('patient.pillbox.active') : t('patient.pillbox.inactive')}
              </span>
            </div>
            {dosage && (
              <p className="truncate text-muted-foreground text-xs" title={dosage}>
                {dosage}
              </p>
            )}
            {medication.instructions && (
              <p
                className="truncate text-[11px] text-muted-foreground/80 italic"
                title={medication.instructions}
              >
                {medication.instructions}
              </p>
            )}
          </div>

          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
