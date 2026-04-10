import { useQuery } from '@tanstack/react-query';
import { useTrpc } from '@/providers/trpc';

export function usePillboxToday(enabled = true) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.pillbox.today.queryOptions({}),
    enabled,
  });
}
