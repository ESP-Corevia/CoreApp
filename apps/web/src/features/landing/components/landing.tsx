import { useQuery } from '@tanstack/react-query';

import { Trans } from 'react-i18next';

import { useTrpc } from '@/providers/trpc';

export default function Landing({
  
}: {
  
}) {
  const trpc = useTrpc();
  // const { data: privateData, isLoading } = useQuery({
  //   ...trpc.privateData.queryOptions(),
  //   enabled: !!session?.isAuthenticated,
  // });
  // if (!session?.isAuthenticated) {
  //   return null;
  // }
  // if (isLoading)
  //   return (
  //     <div>
  //       <Trans i18nKey="dashboard.loading">Loading...</Trans>
  //     </div>
  //   );
  return (
    <div>
      <h1 role="heading">
        <Trans i18nKey="dashboard.title">Dashboard</Trans>
      </h1>
      <p>
        {/* <Trans i18nKey="dashboard.welcome">Welcomeeeeeeeee {{ userId: privateData?.user }}</Trans> */}
        <p>Prout</p>
      </p>
      <p>
        <Trans
          i18nKey="dashboard.privateData"
          defaults="privateData: {{ message }}"
          // values={{ message: privateData?.message }}
        />
      </p>
    </div>
  );
}
