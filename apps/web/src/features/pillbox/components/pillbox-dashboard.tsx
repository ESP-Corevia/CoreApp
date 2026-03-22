import { useState } from 'react';

import { useDebounce } from '@uidotdev/usehooks';
import { Pill, Plus, Search, ShieldCheck } from 'lucide-react';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAdminPillboxList } from '@/queries';

import PillboxMedicationCard from './pillbox-medication-card';

export default function PillboxDashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();
  const isAuthenticated = !!session?.isAuthenticated;

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
  });

  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 700);
  const { data: adminData, isLoading } = useAdminPillboxList({
    search: debouncedSearchTerm || undefined,
    isActive: activeFilter,
    page: queryParams.page,
    limit: 12,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  const treatments = adminData?.items ?? [];
  const total = adminData?.total ?? 0;
  const pageLimit = adminData?.limit ?? 12;
  const totalPages = Math.ceil(total / pageLimit);

  // ── Filter badges ──────────────────────────────────────────────
  const filterBadges = (
    <div className="flex items-center gap-2">
      {(
        [
          { value: true, label: t('pillbox.activeFilter', 'Actifs'), variant: 'emerald' },
          { value: false, label: t('pillbox.inactiveFilter', 'Inactifs'), variant: 'gray' },
          { value: undefined, label: t('pillbox.allFilter', 'Tous'), variant: 'default' },
        ] as const
      ).map(filter => (
        <button
          key={String(filter.value)}
          type="button"
          onClick={() => {
            setActiveFilter(filter.value);
            void setQueryParams({ page: 1 });
          }}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            activeFilter === filter.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-muted'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );

  // ── Pagination ─────────────────────────────────────────────────
  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={queryParams.page <= 1}
        onClick={() => void setQueryParams({ page: queryParams.page - 1 })}
      >
        {t('common.previous', 'Précédent')}
      </Button>
      <span className="text-muted-foreground text-sm tabular-nums">
        {t('common.pageOf', 'Page {{page}} sur {{total}}', {
          page: queryParams.page,
          total: totalPages,
        })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={queryParams.page >= totalPages}
        onClick={() => void setQueryParams({ page: queryParams.page + 1 })}
      >
        {t('common.next', 'Suivant')}
      </Button>
    </div>
  );

  // ── Loading skeleton ───────────────────────────────────────────
  const gridSkeleton = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );

  // ── Empty state ────────────────────────────────────────────────
  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16">
      <div className="bg-muted rounded-full p-4">
        <Pill className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="text-center">
        <p className="text-muted-foreground font-medium">
          {t('pillbox.noTreatmentsAdmin', 'Aucun traitement trouvé')}
        </p>
        <p className="text-muted-foreground/70 mt-1 text-sm">
          {t('pillbox.noTreatmentsAdminHint', 'Aucun résultat pour vos critères de recherche')}
        </p>
      </div>
      <Button asChild variant="outline" className="mt-2">
        <Link to="/medications">
          <Plus className="mr-2 h-4 w-4" />
          {t('pillbox.addTreatment', 'Ajouter un traitement')}
        </Link>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <ShieldCheck className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('pillbox.adminTitle', 'Gestion des piluliers')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('pillbox.adminSubtitle', 'Tous les traitements patients')}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/medications">
            <Plus className="mr-2 h-4 w-4" />
            {t('pillbox.addTreatment', 'Ajouter un traitement')}
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t('pillbox.searchPlaceholder', 'Rechercher un patient ou médicament...')}
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              void setQueryParams({ page: 1 });
            }}
            className="pl-9"
          />
        </div>
        {filterBadges}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-muted-foreground text-sm">
          {t('pillbox.resultsCount', '{{count}} traitement(s) trouvé(s)', { count: total })}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        gridSkeleton
      ) : treatments.length === 0 ? (
        emptyState
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {treatments.map(med => (
              <PillboxMedicationCard key={med.id} medication={med} />
            ))}
          </div>
          {pagination}
        </>
      )}
    </div>
  );
}
