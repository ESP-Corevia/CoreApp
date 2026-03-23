import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useListDoctors } from '@/queries';

import DoctorsTable from './doctors-table';

export default function DoctorsDashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
  });

  const [search, setSearch] = useState(queryParams.search);

  const {
    data: doctorsData,
    error,
    isLoading,
  } = useListDoctors({
    page: queryParams.page,
    perPage: queryParams.perPage,
    search: search || undefined,
    enabled: !!session?.isAuthenticated,
  });

  useEffect(() => {
    if (error) {
      toast.error(
        t('doctors.loadError', 'Failed to load doctors: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }, [error, t]);

  const handleSearchChange = useCallback(
    async (value: string) => {
      setSearch(value);
      await setQueryParams({ page: 1, search: value });
    },
    [setQueryParams],
  );

  if (!session?.isAuthenticated) {
    return null;
  }

  const doctorRows = doctorsData?.doctors ?? [];
  const totalDoctors = doctorsData?.totalItems ?? 0;
  const pageCount = Math.ceil(totalDoctors / queryParams.perPage);

  return (
    <div className="space-y-6">
      <DoctorsTable
        title={t('doctors.title', 'Doctors Management')}
        data={doctorRows}
        pageCount={pageCount}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
      />
    </div>
  );
}
