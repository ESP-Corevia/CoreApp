import { useQuery } from '@tanstack/react-query';
import { useTrpc } from '@/providers/trpc';

export function usePillboxDetail(id: string, enabled = true) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.pillbox.detail.queryOptions({ id }),
    enabled: enabled && !!id,
  });
}
