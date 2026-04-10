import { Pill, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Loader from '@/components/loader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctorVerified } from '@/hooks/use-doctor-verified';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useDoctorSearchMedications } from '@/queries/doctor';

export default function DoctorMedications() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('doctor');
  const { isLoading: verifiedLoading } = useDoctorVerified();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading: searchLoading } = useDoctorSearchMedications(
    { query: debouncedSearch, limit: 20 },
    debouncedSearch.length >= 2,
  );

  if (authLoading || roleLoading || verifiedLoading) return <Loader />;

  const results = (
    Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [])
  ) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-4">
      <h1 className="font-bold text-2xl">{t('doctor.medications.title')}</h1>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('doctor.medications.search')}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </div>

      {debouncedSearch.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Pill className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">{t('doctor.medications.search')}</p>
        </div>
      ) : searchLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="font-medium">{t('doctor.medications.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((med, i) => (
            <Card key={(med.id as string) ?? i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium text-sm">
                      {(med.name as string) ?? (med.denomination as string) ?? '—'}
                    </p>
                    {med.form && (
                      <p className="text-muted-foreground text-xs">{med.form as string}</p>
                    )}
                    {med.activeSubstances && (
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(med.activeSubstances) ? med.activeSubstances : []).map(
                          (sub, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {typeof sub === 'string'
                                ? sub
                                : (((sub as Record<string, unknown>)?.name as string) ?? '')}
                            </Badge>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  <Pill className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
