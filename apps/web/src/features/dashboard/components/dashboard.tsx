import { useState, useCallback, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useTrpc } from '@/providers/trpc';
import type { User, ExtendedColumnFilter, ExtendedColumnSort } from '@/types/data-table';

import { useListUsers } from '../../../queries';

import DataTableUsers from './table';

export default function Dashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();
  const trpc = useTrpc();

  useQuery({
    ...trpc.privateData.queryOptions(),
    enabled: !!session?.isAuthenticated,
  });

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sortBy: parseAsString.withDefault('createdAt'),
    sortDirection: parseAsString.withDefault('desc'),
    search: parseAsString.withDefault(''),
  });

  const [search, setSearch] = useState(queryParams.search);
  const [filters, setFilters] = useState<ExtendedColumnFilter<User>[]>([]);
  const [sorting, setSorting] = useState<ExtendedColumnSort<User>>({
    id: queryParams.sortBy as keyof User,
    desc: queryParams.sortDirection === 'desc',
  });
  const {
    data: usersData,
    error,
    isLoading: isLoadingUsers,
  } = useListUsers({
    page: queryParams.page,
    perPage: queryParams.perPage,
    search,
    sorting,
    enabled: !!session?.isAuthenticated,
    filters,
  });

  useEffect(() => {
    if (error) {
      toast.error(
        t('dashboard.loadUsersError', 'Failed to load users: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  }, [error, t]);

  const handleSearchChange = useCallback(
    async (value: string) => {
      setSearch(value);
      await setQueryParams({ page: 1, search: value });
    },
    [setQueryParams]
  );

  const handleFiltersChange = useCallback((value: ExtendedColumnFilter<User>[]) => {
    setFilters(value);
  }, []);

  const handleSortingChange = useCallback((value: ExtendedColumnSort<User>) => {
    setSorting(value);
  }, []);

  if (!session?.isAuthenticated) {
    return null;
  }

  const userRows = usersData?.users ?? [];
  const totalUsers = usersData?.totalItems ?? 0;
  const pageCount = Math.ceil(totalUsers / queryParams.perPage);

  return (
    <div className="space-y-6">
      <DataTableUsers
        title={t('dashboard.userManagement', 'Users Management')}
        data={userRows}
        pageCount={pageCount}
        isLoading={isLoadingUsers}
        search={search}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
}
