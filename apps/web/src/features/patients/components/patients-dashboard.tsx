import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useListPatients } from '@/queries';

import { PatientCreateDialog } from './modals/patient-create-dialog';
import PatientsTable from './patients-table';

export default function PatientsDashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    gender: parseAsStringEnum(['MALE', 'FEMALE']),
  });

  const [search, setSearch] = useState(queryParams.search);

  const {
    data: patientsData,
    error,
    isLoading,
  } = useListPatients({
    page: queryParams.page,
    perPage: queryParams.perPage,
    search: search || undefined,
    gender: (queryParams.gender ?? undefined) as 'MALE' | 'FEMALE' | undefined,
    enabled: !!session?.isAuthenticated,
  });

  useEffect(() => {
    if (error) {
      toast.error(
        t('patients.loadError', 'Failed to load patients: {{message}}', {
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

  const handleGenderChange = useCallback(
    async (gender: string | null) => {
      await setQueryParams({
        page: 1,
        gender: gender as 'MALE' | 'FEMALE' | null,
      });
    },
    [setQueryParams],
  );

  if (!session?.isAuthenticated) {
    return null;
  }

  const patientRows = patientsData?.patients ?? [];
  const totalPatients = patientsData?.totalItems ?? 0;
  const pageCount = Math.ceil(totalPatients / queryParams.perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <PatientCreateDialog />
      </div>
      <PatientsTable
        title={t('patients.title', 'Patients Management')}
        data={patientRows}
        pageCount={pageCount}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
        onGenderChange={handleGenderChange}
      />
    </div>
  );
}
