import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import Loader from '@/components/loader';
import { useTrpc } from '@/providers/trpc';

import { useListUsers } from '../../../queries';

import DataTableUsers from './table';

export default function Dashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();
  const trpc = useTrpc();

  const { isLoading } = useQuery({
    ...trpc.privateData.queryOptions(),
    enabled: !!session?.isAuthenticated,
  });

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sortBy: parseAsString.withDefault('createdAt'),
    sortDirection: parseAsString.withDefault('desc'),
    filterBy: parseAsString.withDefault(''),
    search: parseAsString.withDefault(''),
  });
  const [search, setSearch] = useState(queryParams.search);
  const {
    data: usersData,
    error,
    isLoading: isLoadingUsers,
  } = useListUsers({
    page: queryParams.page,
    perPage: queryParams.perPage,
    search,
    sortBy: queryParams.sortBy,
    sortDirection: queryParams.sortDirection,
    enabled: !!session?.isAuthenticated,
    filterBy: queryParams.filterBy,
  });

  if (error)
    toast.error(
      t('dashboard.loadUsersError', 'Failed to load users: {{message}}', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    );

  if (!session?.isAuthenticated) {
    return null;
  }

  if (isLoading || isLoadingUsers) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  const userRows = (Array.isArray(usersData) ? usersData : (usersData?.users ?? [])).map(user => ({
    ...user,
    role: user.role ?? 'user',
  }));

  const totalUsers = usersData && 'total' in usersData ? usersData.total : userRows.length;
  const pageCount = Math.ceil(totalUsers / queryParams.perPage);

  return (
    <div className="space-y-6">
      <DataTableUsers
        title={t('dashboard.userManagement', 'Users Management')}
        data={userRows}
        pageCount={pageCount}
        isLoading={isLoadingUsers}
        search={search}
        onSearchChange={async value => {
          setSearch(value);
          await setQueryParams({ ...queryParams, page: 1, search: value });
        }}
      />
    </div>
  );
}
