import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/lib/auth-client';

export function useListSessions() {
  return useQuery({
    queryKey: ['list-sessions'],
    queryFn: async () => {
      const res = await authClient.listSessions();
      return 'data' in res ? res.data : res;
    },
    enabled: true,
  });
}
