import { Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import MedicationFormIcon from '@/components/medication-form-icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PillboxMedication {
  id: string;
  medicationName: string;
  medicationForm?: string | null;
  dosageLabel?: string | null;
  iconKey?: string | null;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  patientName?: string | null;
  patientEmail?: string | null;
}

interface PillboxMedicationCardProps {
  medication: PillboxMedication;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function PillboxMedicationCard({ medication }: PillboxMedicationCardProps) {
  const { t } = useTranslation();
  const isAdmin = !!medication.patientName;

  return (
    <Link to={`/pillbox/${medication.id}`} className="group block">
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          'hover:ring-border/50 hover:shadow-md hover:ring-1',
          'border-l-4',
          medication.isActive
            ? 'border-l-emerald-500 dark:border-l-emerald-600'
            : 'border-l-gray-300 dark:border-l-gray-600'
        )}
      >
        <CardContent className="p-4">
          {/* Admin: patient info */}
          {isAdmin && (
            <div className="mb-3 flex items-center gap-2.5 border-b pb-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {getInitials(medication.patientName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm leading-tight font-medium">
                  {medication.patientName}
                </p>
                {medication.patientEmail && (
                  <p className="text-muted-foreground truncate text-xs">
                    {medication.patientEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Medication info */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MedicationFormIcon iconKey={medication.iconKey} size="sm" />
                <h3 className="truncate text-sm font-semibold">{medication.medicationName}</h3>
              </div>
              {(medication.medicationForm ?? medication.dosageLabel) && (
                <p className="text-muted-foreground mt-1 truncate pl-6 text-xs">
                  {[medication.medicationForm, medication.dosageLabel]
                    .filter(Boolean)
                    .join(' \u2014 ')}
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                medication.isActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
              )}
            >
              {medication.isActive
                ? t('pillbox.active', 'Actif')
                : t('pillbox.inactive', 'Inactif')}
            </Badge>
          </div>

          {/* Dates */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {formatDate(medication.startDate)}
                {medication.endDate ? ` \u2192 ${formatDate(medication.endDate)}` : ''}
              </span>
            </div>
            <ChevronRight className="text-muted-foreground/50 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
