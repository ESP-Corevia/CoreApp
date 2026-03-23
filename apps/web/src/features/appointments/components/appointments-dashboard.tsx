import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useListAppointments } from '@/queries';

import AppointmentsTable from './appointments-table';

export default function AppointmentsDashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    status: parseAsStringEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
    sort: parseAsStringEnum(['dateAsc', 'dateDesc', 'createdAtDesc']).withDefault('dateDesc'),
  });

  const [search, setSearch] = useState(queryParams.search);

  const {
    data: appointmentsData,
    error,
    isLoading,
  } = useListAppointments({
    page: queryParams.page,
    perPage: queryParams.perPage,
    search: search || undefined,
    status: (queryParams.status ?? undefined) as
      | 'PENDING'
      | 'CONFIRMED'
      | 'CANCELLED'
      | 'COMPLETED'
      | undefined,
    sort: queryParams.sort as 'dateAsc' | 'dateDesc' | 'createdAtDesc',
    enabled: !!session?.isAuthenticated,
  });

  useEffect(() => {
    if (error) {
      toast.error(
        t('appointments.loadError', 'Failed to load appointments: {{message}}', {
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

  const appointmentRows = appointmentsData?.appointments ?? [];
  const totalAppointments = appointmentsData?.totalItems ?? 0;
  const pageCount = Math.ceil(totalAppointments / queryParams.perPage);

  return (
    <div className="space-y-6">
      <AppointmentsTable
        title={t('appointments.title', 'Appointments Management')}
        data={appointmentRows}
        pageCount={pageCount}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
      />
    </div>
  );
}
