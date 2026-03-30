import { Loader2, Pill } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import AddToPillboxDialog from './add-to-pillbox-dialog';
import MedicationCard, { type MedicationData } from './medication-card';

interface MedicationResultsListProps {
  items: MedicationData[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export default function MedicationResultsList({
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: MedicationResultsListProps) {
  const { t } = useTranslation();
  const [selectedMedication, setSelectedMedication] = useState<MedicationData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleAdd = (medication: MedicationData) => {
    setSelectedMedication(medication);
    setDialogOpen(true);
  };

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Initial loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-xl border border-l-[3px] border-l-muted-foreground/20 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Skeleton className="size-7 rounded-lg" />
                <Skeleton className="h-4 w-32" />
              </div>
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
            <div className="border-t pt-3">
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted/50">
          <Pill className="size-10 text-muted-foreground" />
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
        <AnimatePresence mode="popLayout">
          {items.map((medication, index) => (
            <motion.div
              key={medication.externalId ?? medication.cis ?? index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: Math.min((index % 12) * 0.03, 0.3) }}
              layout
            >
              <MedicationCard medication={medication} onAdd={handleAdd} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t('common.loadingMore', 'Chargement...')}
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && items.length > 0 && (
        <p className="py-4 text-center text-muted-foreground/60 text-xs">
          {t('medications.endOfResults', 'Fin des résultats')}
        </p>
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
