import { Building2, Euro, Percent, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import MedicationFormIcon from '@/components/medication-form-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MedicationData {
  externalId: string | null;
  cis: string | null;
  cip: string | null;
  name: string;
  shortLabel: string;
  form: string | null;
  route: string | null;
  activeSubstances: string[];
  laboratory: string | null;
  reimbursementRate: string | null;
  price: string | null;
  status: string | null;
  marketingStatus: string | null;
  source: string;
  normalizedForm: string;
  iconKey: string;
}

interface MedicationCardProps {
  medication: MedicationData;
  onAdd: (medication: MedicationData) => void;
}

export default function MedicationCard({ medication, onAdd }: MedicationCardProps) {
  const { t } = useTranslation();

  const isActive = medication.status === 'Commercialisée';

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md',
        isActive
          ? 'border-l-[3px] border-l-teal-500 dark:border-l-teal-400'
          : 'border-l-[3px] border-l-amber-400 dark:border-l-amber-500',
      )}
    >
      {/* Header */}
      <div className="space-y-2 p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <MedicationFormIcon iconKey={medication.iconKey} withBackground size="sm" />
            <h3 className="font-semibold text-sm leading-snug">{medication.name}</h3>
          </div>
          {medication.status && (
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 font-medium text-[10px]',
                isActive
                  ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
              )}
            >
              {medication.status}
            </Badge>
          )}
        </div>
        {(medication.form ?? medication.route) && (
          <p className="text-muted-foreground text-xs">
            {[medication.form, medication.route].filter(Boolean).join(' — ')}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 space-y-3 px-4 pb-3">
        {/* Active substances */}
        {medication.activeSubstances.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {medication.activeSubstances.map(substance => (
              <Badge
                key={substance}
                variant="secondary"
                className="rounded-full px-2 py-0.5 font-normal text-[10px]"
              >
                {substance}
              </Badge>
            ))}
          </div>
        )}

        {/* Meta info */}
        <div className="space-y-1.5 text-muted-foreground text-xs">
          {medication.laboratory && (
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">{medication.laboratory}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {medication.reimbursementRate && (
              <div className="flex items-center gap-1">
                <Percent className="size-3.5 shrink-0" />
                <span>{medication.reimbursementRate}</span>
              </div>
            )}
            {medication.price != null && (
              <div className="flex items-center gap-1">
                <Euro className="size-3.5 shrink-0" />
                <span>
                  {medication.price} {t('medications.currency', '\u20ac')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/40 dark:hover:text-teal-200"
          onClick={() => onAdd(medication)}
        >
          <Plus className="mr-2 size-4" />
          {t('medications.addToPillbox', 'Ajouter au pilulier')}
        </Button>
      </div>
    </div>
  );
}
