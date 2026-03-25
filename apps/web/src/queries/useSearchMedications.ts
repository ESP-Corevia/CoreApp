import { useQuery } from '@tanstack/react-query';

import { useTrpc } from '@/providers/trpc';

interface UseSearchMedicationsParams {
  query: string;
  page: number;
  limit: number;
  enabled?: boolean;
}

export function useSearchMedications({
  query,
  page,
  limit,
  enabled = true,
}: UseSearchMedicationsParams) {
  const trpc = useTrpc();

  return useQuery({
    ...trpc.medications.search.queryOptions({
      query,
      page,
      limit,
    }),
    enabled: enabled && query.length >= 3,
  });
}
