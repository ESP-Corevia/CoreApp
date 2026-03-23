import type { AppRouter } from '@server/routers';

import type { QueryClient } from '@tanstack/react-query';

import { createTRPCClient, httpBatchLink, type TRPCClient } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { createContext, useContext, useMemo } from 'react';
import { queryClient } from './query';

type TrpcProxy = ReturnType<typeof createTRPCOptionsProxy<AppRouter>>;

export const trpcClient: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
      fetch(url, opts) {
        return fetch(url, { ...opts, credentials: 'include' });
      },
    }),
  ],
});

export const trpc: TrpcProxy = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

const TrpcTestContext = createContext<TrpcProxy | null>(null);

export const useTrpc = (): TrpcProxy => {
  const testTrpc = useContext(TrpcTestContext);
  return testTrpc ?? trpc;
};

export function TrpcTestProvider({
  client,
  queryClient: testQueryClient,
  children,
}: {
  client: TRPCClient<AppRouter>;
  queryClient: QueryClient;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => createTRPCOptionsProxy<AppRouter>({ client, queryClient: testQueryClient }),
    [client, testQueryClient],
  );
  return <TrpcTestContext.Provider value={value}>{children}</TrpcTestContext.Provider>;
}
