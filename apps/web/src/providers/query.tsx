import { QueryClientProvider, QueryClient, QueryCache } from '@tanstack/react-query';

import { toast } from 'sonner';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: error =>
      toast.error(error.message, {
        action: { label: 'retry', onClick: () => void queryClient.invalidateQueries() },
      }),
  }),
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
