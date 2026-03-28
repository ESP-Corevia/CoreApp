import { useInfiniteQuery } from '@tanstack/react-query';

import { trpcClient } from '@/providers/trpc';

interface UseSearchMedicationsParams {
  query: string;
  limit?: number;
  enabled?: boolean;
}

export function useSearchMedications({
  query,
  limit = 12,
  enabled = true,
}: UseSearchMedicationsParams) {
  return useInfiniteQuery({
    queryKey: ['medications', 'search', { query, limit }],
    queryFn: ({ pageParam }) =>
      trpcClient.medications.search.query({ query, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
    },
    enabled: enabled && query.length >= 3,
  });
}
