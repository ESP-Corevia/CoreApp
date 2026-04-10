import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfiniteList } from '@/components/infinite-list';
import Loader from '@/components/loader';
import { Input } from '@/components/ui/input';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { useListDoctors } from '@/queries/patient/useListDoctors';
import { DoctorCard } from '../components/doctor-card';

export default function PatientDoctors() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useListDoctors({ search: debouncedSearch || undefined });

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const items =
    query.data?.pages?.flatMap(
      p => ((p as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [],
    ) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-bold text-2xl">{t('patient.doctors.title')}</h1>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('patient.doctors.search')}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </div>

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
        emptyIcon={<Search className="h-12 w-12" />}
        emptyTitle={t('patient.doctors.empty')}
        emptyDescription={t('patient.doctors.emptyDescription')}
      />
    </div>
  );
}
