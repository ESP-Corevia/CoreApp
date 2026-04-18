import { useInfiniteQuery } from '@tanstack/react-query';
import { trpcClient } from '@/providers/trpc';

export function useListDoctors(
  params: { specialty?: string; city?: string; search?: string } = {},
) {
  const limit = 20;

  return useInfiniteQuery({
    queryKey: ['patient', 'doctors', params],
    queryFn: ({ pageParam = 1 }) =>
      trpcClient.doctors.list.query({
        page: pageParam as number,
        limit,
        specialty: params.specialty,
        city: params.city,
        search: params.search,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const items = (lastPage as Record<string, unknown>)?.items;
      const arr = Array.isArray(items) ? items : [];
      return arr.length < limit ? undefined : allPages.length + 1;
    },
  });
}
