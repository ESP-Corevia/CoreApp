import { Beaker, Building2, Pill, Plus, Search, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Loader from '@/components/loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useCreateMedication } from '@/queries/patient/useCreateMedication';
import { useSearchMedications } from '@/queries/patient/useSearchMedications';
import { ScheduleForm, type ScheduleFormValue } from '../../pillbox/components/schedule-form';

interface MedicationItem {
  externalId?: string | null;
  cis?: string | null;
  cip?: string | null;
  name: string;
  shortLabel?: string;
  form?: string | null;
  laboratory?: string | null;
  activeSubstances?: string[];
  reimbursementRate?: string | null;
  price?: string | null;
}

export default function PatientMedications() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<MedicationItem | null>(null);

  const createMed = useCreateMedication();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading: searchLoading } = useSearchMedications(
    { query: debouncedSearch, limit: 20 },
    debouncedSearch.length >= 3,
  );

  const results = useMemo(() => {
    return (Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ??
        [])) as unknown as MedicationItem[];
  }, [data]);

  const firstPage = data as Record<string, unknown> | undefined;
  const total = (firstPage?.total as number | undefined) ?? results.length;

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const handleAdd = (value: ScheduleFormValue) => {
    if (!selected) return;
    const today = new Date().toISOString().slice(0, 10);
    createMed.mutate(
      {
        medicationName: selected.name,
        medicationExternalId: selected.externalId ?? undefined,
        cis: selected.cis ?? undefined,
        cip: selected.cip ?? undefined,
        dosageLabel: selected.form ?? undefined,
        startDate: today,
        schedules: [
          {
            intakeTime: value.intakeTime,
            intakeMoment: value.intakeMoment,
            quantity: value.quantity,
            unit: value.unit || null,
            notes: value.notes || null,
          },
        ],
      },
      { onSuccess: () => setSelected(null) },
    );
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <section
        aria-label={t('patient.medications.title')}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-card to-card p-4 shadow-sm md:p-5"
      >
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 size-44 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative space-y-3">
          <div>
            <h1 className="font-semibold text-base leading-tight tracking-tight md:text-lg">
              {t('patient.medications.title')}
            </h1>
            <p className="mt-0.5 text-muted-foreground text-xs md:text-sm">
              {t('patient.medications.subtitle')}
            </p>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              className="h-10 bg-background pr-9 pl-9"
              placeholder={t('patient.medications.search')}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              autoComplete="off"
              aria-label={t('patient.medications.search')}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label={t('patient.medications.clearSearch')}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {debouncedSearch.length < 3 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="size-6" aria-hidden="true" />
            </div>
            <p className="font-medium text-sm">{t('patient.medications.minChars')}</p>
          </CardContent>
        </Card>
      ) : searchLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Pill className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium text-sm">{t('patient.medications.empty')}</p>
            <p className="max-w-xs text-muted-foreground text-xs">
              {t('patient.medications.emptyDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between px-1 text-muted-foreground text-xs tabular-nums">
            <span aria-live="polite">
              {t('patient.medications.resultsCount', { count: total })}
            </span>
          </div>

          <ul className="space-y-2.5">
            {results.map((med, i) => {
              const key = med.cis ?? med.cip ?? med.externalId ?? `${med.name}-${i}`;
              const substances = Array.isArray(med.activeSubstances) ? med.activeSubstances : [];
              return (
                <li key={key}>
                  <Card className="overflow-hidden transition-colors hover:border-primary/30">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                          aria-hidden="true"
                        >
                          <Pill className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="line-clamp-2 font-medium text-sm leading-snug"
                            title={med.name}
                          >
                            {med.name}
                          </p>
                          {med.form && (
                            <p className="mt-0.5 truncate text-muted-foreground text-xs">
                              {med.form}
                            </p>
                          )}
                        </div>
                      </div>

                      {(med.laboratory || med.reimbursementRate || med.price) && (
                        <dl className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-3">
                          {med.laboratory && (
                            <div className="flex items-center gap-1.5 truncate text-muted-foreground">
                              <Building2 className="size-3 shrink-0" aria-hidden="true" />
                              <span className="truncate" title={med.laboratory}>
                                {med.laboratory}
                              </span>
                            </div>
                          )}
                          {med.reimbursementRate && (
                            <div className="flex items-center gap-1.5 truncate text-muted-foreground">
                              <Tag className="size-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{med.reimbursementRate}</span>
                            </div>
                          )}
                          {med.price && (
                            <div className="flex items-center gap-1.5 truncate text-muted-foreground tabular-nums">
                              <span className="truncate">{med.price}</span>
                            </div>
                          )}
                        </dl>
                      )}

                      {substances.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Beaker
                            className="size-3 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          {substances.slice(0, 4).map(sub => (
                            <Badge key={sub} variant="outline" className="font-normal text-[10px]">
                              {sub}
                            </Badge>
                          ))}
                          {substances.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{substances.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end border-t pt-3">
                        <Button
                          size="sm"
                          onClick={() => setSelected(med)}
                          aria-label={t('patient.medications.addToPillbox')}
                        >
                          <Plus className="size-4" aria-hidden="true" />
                          {t('patient.medications.addToPillbox')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:rounded-t-none"
        >
          {selected && (
            <>
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>
                  {t('patient.medications.addTitle', { name: selected.name })}
                </SheetTitle>
                <SheetDescription>{t('patient.medications.addDescription')}</SheetDescription>
              </SheetHeader>

              {(selected.form || (selected.activeSubstances?.length ?? 0) > 0) && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-xl border bg-muted/30 p-3 text-xs">
                  {selected.form && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Pill className="size-3" aria-hidden="true" />
                      {selected.form}
                    </span>
                  )}
                  {(selected.activeSubstances ?? []).slice(0, 3).map(sub => (
                    <Badge key={sub} variant="outline" className="font-normal text-[10px]">
                      {sub}
                    </Badge>
                  ))}
                </div>
              )}

              <ScheduleForm
                isPending={createMed.isPending}
                submitLabel={t('patient.medications.addToPillbox')}
                onSubmit={handleAdd}
                onCancel={() => setSelected(null)}
                idPrefix="add-med"
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
