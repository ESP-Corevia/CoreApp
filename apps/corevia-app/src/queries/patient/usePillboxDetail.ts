import { useQuery } from '@tanstack/react-query';
import { trpcClient } from '@/providers/trpc';

export function usePillboxDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: ['patient', 'pillbox', 'detail', id],
    queryFn: () => trpcClient.pillbox.detail.query({ id }),
    enabled: enabled && !!id,
  });
}
