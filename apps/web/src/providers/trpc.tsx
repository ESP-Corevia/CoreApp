import { createContext, useContext } from 'react';

import type { QueryClient } from '@tanstack/react-query';

import { createTRPCClient, httpBatchLink, type TRPCClient } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';

import type { AppRouter } from '@server/routers';

type TrpcProxy = ReturnType<typeof createTRPCOptionsProxy<AppRouter>>;
const TrpcContext = createContext<TrpcProxy | null>(null);
export const useTrpc = () => {
  const v = useContext(TrpcContext);
  if (!v) throw new Error('TrpcContext missing');
  return v;
};

export function TrpcProvider({
  client,
  queryClient,
  children,
}: {
  client: TRPCClient<AppRouter>;
  queryClient: QueryClient;
  children: React.ReactNode;
}) {
  const value = createTRPCOptionsProxy<AppRouter>({ client, queryClient });
  return <TrpcContext.Provider value={value}>{children}</TrpcContext.Provider>;
}

// Runtime client factory (used by root)
export function createRuntimeTrpcClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
        fetch(url, opts) {
          return fetch(url, { ...opts, credentials: 'include' });
        },
      }),
    ],
  });
}
