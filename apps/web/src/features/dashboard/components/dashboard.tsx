import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Trans } from 'react-i18next';
import { useNavigate } from 'react-router';

import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const trpc = useTrpc();
  const privateData = useQuery({
    ...trpc.privateData.queryOptions(),
    enabled: Boolean(session),
  });

  useEffect(() => {
    async function checkAuth() {
      if (!session && !isPending) await navigate('/login');
    }
    void checkAuth();
  }, [session, isPending, navigate]);

  if (isPending)
    return (
      <div>
        <Trans i18nKey="dashboard.loading">Loading...</Trans>
      </div>
    );
  if (!session) return null;
  return (
    <div>
      <h1 role="heading">
        <Trans i18nKey="dashboard.title">Dashboard</Trans>
      </h1>
      <p>
        <Trans i18nKey="dashboard.welcome">Welcome {{ userId: session.userId }}</Trans>
      </p>
      <p>
        <Trans
          i18nKey="dashboard.privateData"
          defaults="privateData: {{ message }}"
          values={{ message: privateData.data?.message }}
        />
      </p>
    </div>
  );
}
