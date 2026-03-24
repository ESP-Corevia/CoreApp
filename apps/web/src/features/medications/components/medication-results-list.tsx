import { ChevronLeft, ChevronRight, Pill } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import AddToPillboxDialog from './add-to-pillbox-dialog';
import MedicationCard, { type MedicationData } from './medication-card';

interface MedicationResultsListProps {
  items: MedicationData[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  // eslint-disable-next-line no-unused-vars
  onPageChange: (page: number) => void;
}

export default function MedicationResultsList({
  items,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: MedicationResultsListProps) {
  const { t } = useTranslation();
  const [selectedMedication, setSelectedMedication] = useState<MedicationData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = (medication: MedicationData) => {
    setSelectedMedication(medication);
    setDialogOpen(true);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className="space-y-4 rounded-xl border border-l-[3px] border-l-muted-foreground/20 p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-1/2" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3.5 w-1/3" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
          <Pill className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium">{t('medications.noResults', 'Aucun médicament trouvé')}</p>
          <p className="mt-1 text-muted-foreground text-sm">
            {t('medications.noResultsHint', 'Essayez avec un autre terme de recherche')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((medication, index) => (
          <MedicationCard
            key={medication.externalId ?? medication.cis ?? index}
            medication={medication}
            onAdd={handleAdd}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t('common.previous', 'Précédent')}
          </Button>
          <span className="min-w-[8rem] text-center text-muted-foreground text-sm tabular-nums">
            {t('common.pageOf', 'Page {{page}} sur {{total}}', {
              page,
              total: totalPages,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {t('common.next', 'Suivant')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add to pillbox dialog */}
      {selectedMedication && (
        <AddToPillboxDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          medication={selectedMedication}
        />
      )}
    </div>
  );
}
