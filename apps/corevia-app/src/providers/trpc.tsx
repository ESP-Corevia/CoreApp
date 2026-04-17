import type { AppRouter } from '@server/routers';
import { createTRPCClient, httpBatchLink, httpLink, type TRPCClient } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { createContext, useContext } from 'react';
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

/** Non-batched client for contexts where concurrent calls must not be merged (e.g. Uppy upload callbacks). */
export const trpcUnbatchedClient: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    httpLink({
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
