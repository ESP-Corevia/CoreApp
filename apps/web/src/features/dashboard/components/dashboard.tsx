import { useQuery } from '@tanstack/react-query';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useTrpc } from '@/providers/trpc';

import { useListUsers } from '../../../queries';

import DataTableDemo from './table';

export default function Dashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();
  const trpc = useTrpc();
  const { data: privateData, isLoading } = useQuery({
    ...trpc.privateData.queryOptions(),
    enabled: !!session?.isAuthenticated,
  });

  const [queryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    sortBy: parseAsString.withDefault('createdAt'),
    sortDirection: parseAsString.withDefault('desc'),
    filterBy: parseAsString.withDefault(''),
  });

  const {
    data: usersData,
    error,
    isLoading: isLoadingUsers,
  } = useListUsers({
    page: queryParams.page,
    perPage: queryParams.perPage,
    search: queryParams.search,
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

  if (isLoading || isLoadingUsers)
    return (
      <div>
        <Trans i18nKey="dashboard.loading">Loading...</Trans>
      </div>
    );

  const userRows = (Array.isArray(usersData) ? usersData : (usersData?.users ?? [])).map(user => ({
    ...user,
    role: user.role ?? 'user',
  }));
  const totalUsers = usersData && 'total' in usersData ? usersData.total : userRows.length;
  const pageCount = Math.ceil(totalUsers / queryParams.perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 role="heading" className="text-3xl font-bold">
          <Trans i18nKey="dashboard.title">Dashboard</Trans>
        </h1>
        <p className="text-muted-foreground">
          <Trans i18nKey="dashboard.welcome">Welcome {{ userId: privateData?.user }}</Trans>
        </p>
      </div>
      <DataTableDemo data={userRows} pageCount={pageCount} />
    </div>
  );
}
