import { useEffect, useState } from 'react';

import { useDebounce } from '@uidotdev/usehooks';
import { AlertTriangle, Pill, Search, ShieldCheck } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchMedications } from '@/queries';

import MedicationResultsList from './medication-results-list';

interface MedicationsSearchProps {
  session: {
    isAuthenticated: boolean;
    userId: string;
  } | null;
}

export default function MedicationsSearch({ session }: MedicationsSearchProps) {
  const { t } = useTranslation();

  const [queryParams, setQueryParams] = useQueryStates({
    q: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
  });

  const [searchInput, setSearchInput] = useState(queryParams.q);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Sync debounced value to URL params
  useEffect(() => {
    if (debouncedSearch !== queryParams.q) {
      void setQueryParams({ q: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, queryParams.q, setQueryParams]);

  const {
    data: searchData,
    isLoading,
    error,
    refetch,
  } = useSearchMedications({
    query: debouncedSearch,
    page: queryParams.page,
    limit: 12,
    enabled: !!session?.isAuthenticated,
  });

  if (!session?.isAuthenticated) {
    return null;
  }

  const items = searchData?.items ?? [];
  const total = searchData?.total ?? 0;
  const limit = searchData?.limit ?? 12;
  const totalPages = Math.ceil(total / limit);
  const handlePageChange = (page: number) => {
    void setQueryParams({ page });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40">
          <Pill className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('medications.title', 'Recherche de médicaments')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('medications.subtitle', 'Consultez la base nationale et ajoutez à votre pilulier')}
          </p>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="flex items-start gap-3 rounded-lg border border-sky-200/60 bg-sky-50/50 p-4 dark:border-sky-800/40 dark:bg-sky-950/20">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
        <p className="text-sm leading-relaxed text-sky-900 dark:text-sky-200">
          {t(
            'medications.disclaimer',
            'Les informations affichées sont fournies à titre informatif. Demandez toujours conseil à un professionnel de santé avant de débuter, modifier ou arrêter un traitement.'
          )}
        </p>
      </div>

      {/* Search input */}
      <div className="relative max-w-2xl">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
        <Input
          type="search"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder={t(
            'medications.searchPlaceholder',
            'Rechercher un médicament (min. 3 caractères, sans accents)...'
          )}
          className="h-12 rounded-xl border-2 pl-12 text-base transition-colors focus-visible:border-teal-400 dark:focus-visible:border-teal-500"
        />
      </div>

      {/* Minimum characters hint */}
      {!error && queryParams.q.length > 0 && queryParams.q.length < 3 && (
        <p className="text-muted-foreground text-center text-sm">
          {t('medications.minChars', 'Saisissez au moins 3 caractères pour lancer la recherche')}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div className="text-center">
            <p className="font-medium">
              {t('medications.searchError', 'Erreur lors de la recherche')}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('medications.searchErrorHint', 'Vérifiez votre connexion et réessayez')}
            </p>
          </div>
          <Button variant="outline" onClick={() => void refetch()} className="mt-2">
            {t('common.retry', 'Réessayer')}
          </Button>
        </div>
      )}

      {/* Results */}
      {!error && queryParams.q.length >= 3 && (
        <MedicationResultsList
          items={items}
          isLoading={isLoading}
          page={queryParams.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
