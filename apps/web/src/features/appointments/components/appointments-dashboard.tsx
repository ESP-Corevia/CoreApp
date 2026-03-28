import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useListAppointments } from '@/queries';

import AppointmentsTable from './appointments-table';
import { AppointmentCreateDialog } from './modals/appointment-create-dialog';

function timestampToDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
    status: parseAsArrayOf(parseAsStringEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])),
    sort: parseAsStringEnum(['dateAsc', 'dateDesc', 'createdAtDesc']).withDefault('dateDesc'),
  });

  const [dateFilter] = useQueryState('date', parseAsString);

  const { from, to } = useMemo(() => {
    if (!dateFilter) return {};
    const raw = String(dateFilter);
    const parts = raw.split(',').map(Number).filter(Boolean);
    return {
      from: parts[0] ? timestampToDate(parts[0]) : undefined,
      to: parts[1] ? timestampToDate(parts[1]) : undefined,
    };
  }, [dateFilter]);

  const [search, setSearch] = useState(queryParams.search);

  const {
    data: appointmentsData,
    error,
    isLoading,
  } = useListAppointments({
    page: queryParams.page,
    perPage: queryParams.perPage,
    search: search || undefined,
    status:
      queryParams.status && queryParams.status.length > 0
        ? (queryParams.status as ('PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED')[])
        : undefined,
    from,
    to,
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
      <div className="flex items-center justify-end">
        <AppointmentCreateDialog />
      </div>
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
