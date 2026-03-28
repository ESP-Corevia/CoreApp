import { useDebounce } from '@uidotdev/usehooks';
import { AlertTriangle, Pill, Search, ShieldCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchMedications({
      query: debouncedSearch,
      limit: 12,
      enabled: !!session?.isAuthenticated,
    });

  const items = data?.pages.flatMap(page => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!session?.isAuthenticated) {
    return null;
  }

  const hasQuery = debouncedSearch.length >= 3;
  const showHint = searchInput.length > 0 && searchInput.length < 3;
  const hasResults = hasQuery && !error;

  return (
    <div className="space-y-6">
      {/* Search hero — centered when idle, stays at top when results show */}
      <div className={'flex flex-col items-center pt-8 pb-4'}>
        <div className={'w-full max-w-xl space-y-5 text-center'}>
          {/* Header */}
          <div
            className={hasResults ? 'flex items-center gap-3' : 'flex flex-col items-center gap-3'}
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40">
              <Pill className="size-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight">
                {t('medications.title', 'Recherche de médicaments')}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t(
                  'medications.subtitle',
                  'Consultez la base nationale et ajoutez à votre pilulier',
                )}
              </p>
            </div>
          </div>

          {/* Search input */}
          <div className={'relative'}>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t(
                'medications.searchPlaceholder',
                'Rechercher un médicament (min. 3 caractères, sans accents)...',
              )}
              className="h-12 w-full rounded-xl border bg-transparent pr-10 pl-12 text-base outline-none transition-colors placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Hint */}
          {showHint && !error && (
            <p className="text-muted-foreground text-sm">
              {t(
                'medications.minChars',
                'Saisissez au moins 3 caractères pour lancer la recherche',
              )}
            </p>
          )}

          {/* Disclaimer — only visible before search */}
          {!hasResults && !showHint && (
            <div className="flex items-start gap-3 rounded-lg border border-sky-200/60 bg-sky-50/50 p-4 text-left dark:border-sky-800/40 dark:bg-sky-950/20">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-400" />
              <p className="text-sky-900 text-sm leading-relaxed dark:text-sky-200">
                {t(
                  'medications.disclaimer',
                  'Les informations affichées sont fournies à titre informatif. Demandez toujours conseil à un professionnel de santé avant de débuter, modifier ou arrêter un traitement.',
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Result count */}
      {hasQuery && !isLoading && !error && total > 0 && (
        <p className="text-muted-foreground text-sm tabular-nums">
          {t('medications.resultCount', '{{count}} résultat(s) trouvé(s)', { count: total })}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="size-8 text-red-500" />
          </div>
          <div className="text-center">
            <p className="font-medium">
              {t('medications.searchError', 'Erreur lors de la recherche')}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              {t('medications.searchErrorHint', 'Vérifiez votre connexion et réessayez')}
            </p>
          </div>
          <Button variant="outline" onClick={() => void refetch()} className="mt-2">
            {t('common.retry', 'Réessayer')}
          </Button>
        </div>
      )}

      {/* Results */}
      {!error && hasQuery && (
        <MedicationResultsList
          items={items}
          isLoading={isLoading}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      )}
    </div>
  );
}
