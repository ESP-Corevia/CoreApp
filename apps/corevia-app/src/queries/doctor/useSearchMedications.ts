import { useQuery } from '@tanstack/react-query';
import { useTrpc } from '@/providers/trpc';

export function useSearchMedications(params: { query: string; limit?: number }, enabled = true) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.doctor.medications.search.queryOptions(params),
    enabled: enabled && !!params.query,
  });
}
