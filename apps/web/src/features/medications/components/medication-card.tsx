import { Building2, Euro, Percent, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import MedicationFormIcon from '@/components/medication-form-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  // eslint-disable-next-line no-unused-vars
  onAdd: (medication: MedicationData) => void;
}

export default function MedicationCard({ medication, onAdd }: MedicationCardProps) {
  const { t } = useTranslation();

  const isActive = medication.status === 'Commercialisée';

  return (
    <Card
      className={cn(
        'flex h-full flex-col border-l-[3px] transition-shadow hover:shadow-md',
        isActive
          ? `border-l-teal-500 dark:border-l-teal-400`
          : 'border-l-amber-400 dark:border-l-amber-500'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <MedicationFormIcon iconKey={medication.iconKey} withBackground size="sm" />
            <CardTitle className="text-sm leading-snug font-semibold">{medication.name}</CardTitle>
          </div>
          {medication.status && (
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-[10px] font-medium',
                isActive
                  ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
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
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-2">
        {/* Active substances */}
        {medication.activeSubstances.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {medication.activeSubstances.map(substance => (
              <Badge
                key={substance}
                variant="secondary"
                className="rounded-full px-2 py-0.5 text-[10px] font-normal"
              >
                {substance}
              </Badge>
            ))}
          </div>
        )}

        {/* Bottom info row */}
        <div className="space-y-1.5">
          {medication.laboratory && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{medication.laboratory}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {medication.reimbursementRate && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Percent className="h-3.5 w-3.5 shrink-0" />
                <span>{medication.reimbursementRate}</span>
              </div>
            )}
            {medication.price != null && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Euro className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {medication.price} {t('medications.currency', '\u20ac')}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/40 dark:hover:text-teal-200"
          onClick={() => onAdd(medication)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('medications.addToPillbox', 'Ajouter au pilulier')}
        </Button>
      </CardFooter>
    </Card>
  );
}
