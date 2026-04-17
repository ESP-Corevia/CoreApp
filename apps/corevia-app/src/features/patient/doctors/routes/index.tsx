import { MapPin, Search, Stethoscope, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfiniteList } from '@/components/infinite-list';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { cn } from '@/lib/utils';
import { useListDoctors } from '@/queries/patient/useListDoctors';
import { DoctorCard } from '../components/doctor-card';

export default function PatientDoctors() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const [searchInput, setSearchInput] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedSpecialty, setDebouncedSpecialty] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setDebouncedSpecialty(specialty.trim());
      setDebouncedCity(city.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, specialty, city]);

  const query = useListDoctors({
    search: debouncedSearch || undefined,
    specialty: debouncedSpecialty || undefined,
    city: debouncedCity || undefined,
  });

  const items = useMemo(
    () =>
      query.data?.pages?.flatMap(
        p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
      ) ?? [],
    [query.data?.pages],
  );

  const firstPage = query.data?.pages?.[0] as Record<string, unknown> | undefined;
  const total = (firstPage?.total as number | undefined) ?? items.length;

  const hasActiveFilters = !!(debouncedSearch || debouncedSpecialty || debouncedCity);

  const clearAll = () => {
    setSearchInput('');
    setSpecialty('');
    setCity('');
  };

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  return (
    <div className="space-y-4 md:space-y-5">
      <section
        aria-label={t('patient.doctors.title')}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-card to-card p-4 shadow-sm md:p-5"
      >
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 size-44 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative space-y-3">
          <div>
            <h1 className="font-semibold text-base leading-tight tracking-tight md:text-lg">
              {t('patient.doctors.title')}
            </h1>
            <p className="mt-0.5 text-muted-foreground text-xs md:text-sm">
              {t('patient.doctors.subtitle')}
            </p>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="h-10 bg-background pr-9 pl-9"
              placeholder={t('patient.doctors.search')}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              type="search"
              autoComplete="off"
              aria-label={t('patient.doctors.search')}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label={t('patient.doctors.clearSearch')}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="relative">
              <Stethoscope
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-9 bg-background pl-9 text-sm"
                placeholder={t('patient.doctors.filterSpecialty')}
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                aria-label={t('patient.doctors.filterSpecialty')}
                autoComplete="off"
              />
            </div>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-9 bg-background pl-9 text-sm"
                placeholder={t('patient.doctors.filterCity')}
                value={city}
                onChange={e => setCity(e.target.value)}
                aria-label={t('patient.doctors.filterCity')}
                autoComplete="off"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {debouncedSearch && (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    <Search className="size-3" aria-hidden="true" />
                    <span className="max-w-[12ch] truncate">{debouncedSearch}</span>
                  </span>
                )}
                {debouncedSpecialty && (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    <Stethoscope className="size-3" aria-hidden="true" />
                    <span className="max-w-[12ch] truncate">{debouncedSpecialty}</span>
                  </span>
                )}
                {debouncedCity && (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    <MapPin className="size-3" aria-hidden="true" />
                    <span className="max-w-[12ch] truncate">{debouncedCity}</span>
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 shrink-0">
                <X className="size-3.5" aria-hidden="true" />
                {t('patient.doctors.clearFilters')}
              </Button>
            </div>
          )}
        </div>
      </section>

      {!query.isLoading && items.length > 0 && (
        <div
          className={cn(
            'flex items-center justify-between px-1 text-muted-foreground text-xs',
            'tabular-nums',
          )}
        >
          <span aria-live="polite">{t('patient.doctors.resultsCount', { count: total })}</span>
        </div>
      )}

      <InfiniteList
        items={items}
        renderItem={item => (
          <DoctorCard
            key={(item as Record<string, unknown>).id as string}
            doctor={item as Parameters<typeof DoctorCard>[0]['doctor']}
          />
        )}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        fetchNextPage={query.fetchNextPage}
        emptyIcon={<Search className="size-10" />}
        emptyTitle={t('patient.doctors.empty')}
        emptyDescription={t('patient.doctors.emptyDescription')}
      />
    </div>
  );
}
