import { useQuery } from '@tanstack/react-query';

import { Trans } from 'react-i18next';

import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

import DataTableDemo from './table';

export default function Dashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const trpc = useTrpc();
  const { data: privateData, isLoading } = useQuery({
    ...trpc.privateData.queryOptions(),
    enabled: !!session?.isAuthenticated,
  });
  const {
    data: users,
    error,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await authClient.admin.listUsers({ query: {} });
      return 'data' in res ? res.data : res;
    },
  });
  if (error) console.error(error);
  if (isLoadingUsers) {
    // optional lightweight fallback; remove if you don't need it
    return <div className="text-muted-foreground p-4 text-sm">Loading users…</div>;
  }
  if (!session?.isAuthenticated) {
    return null;
  }
  if (isLoading)
    return (
      <div>
        <Trans i18nKey="dashboard.loading">Loading...</Trans>
      </div>
    );
  const userRows = Array.isArray(users) ? users : (users?.users ?? []);
  return (
    <div>
      <h1 role="heading">
        <Trans i18nKey="dashboard.title">Dashboard</Trans>
      </h1>
      <p>
        <Trans i18nKey="dashboard.welcome">Welcome {{ userId: privateData?.user }}</Trans>
      </p>
      <p>
        <Trans
          i18nKey="dashboard.privateData"
          defaults="privateData: {{ message }}"
          values={{ message: privateData?.message }}
        />
      </p>
      <DataTableDemo data={userRows} />
    </div>
  );
}
