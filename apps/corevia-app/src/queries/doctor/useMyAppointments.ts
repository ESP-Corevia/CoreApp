import { useInfiniteQuery } from '@tanstack/react-query';
import { trpcClient } from '@/providers/trpc';

export function useMyAppointments(params: { status?: string } = {}) {
  const limit = 20;

  return useInfiniteQuery({
    queryKey: ['doctor', 'appointments', params],
    queryFn: ({ pageParam = 1 }) =>
      trpcClient.doctor.appointments.listMine.query({
        page: pageParam as number,
        limit,
        status: params.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const items = (lastPage as Record<string, unknown>)?.items;
      const arr = Array.isArray(items) ? items : [];
      return arr.length < limit ? undefined : allPages.length + 1;
    },
  });
}
