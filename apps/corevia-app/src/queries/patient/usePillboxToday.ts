import { useQuery } from '@tanstack/react-query';
import { trpcClient } from '@/providers/trpc';

export function usePillboxToday(enabled = true) {
  return useQuery({
    queryKey: ['patient', 'pillbox', 'today'],
    queryFn: () => trpcClient.pillbox.today.query({}),
    enabled,
  });
}
