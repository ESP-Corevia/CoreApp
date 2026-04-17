import { useInfiniteQuery } from '@tanstack/react-query';
import { trpcClient } from '@/providers/trpc';

export function useMyPillbox(params: { isActive?: boolean } = {}) {
  const limit = 20;

  return useInfiniteQuery({
    queryKey: ['patient', 'pillbox', params],
    queryFn: ({ pageParam = 1 }) =>
      trpcClient.pillbox.listMine.query({
        page: pageParam as number,
        limit,
        isActive: params.isActive,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const items = (lastPage as Record<string, unknown>)?.items;
      const arr = Array.isArray(items) ? items : [];
      return arr.length < limit ? undefined : allPages.length + 1;
    },
  });
}
