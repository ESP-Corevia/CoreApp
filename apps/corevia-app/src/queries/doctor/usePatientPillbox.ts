import { useInfiniteQuery } from '@tanstack/react-query';
import { trpcClient } from '@/providers/trpc';

export function usePatientPillbox(params: { patientId: string; isActive?: boolean }) {
  const limit = 20;

  return useInfiniteQuery({
    queryKey: ['doctor', 'pillbox', params.patientId, params],
    queryFn: ({ pageParam = 1 }) =>
      trpcClient.doctor.pillbox.listByPatient.query({
        patientId: params.patientId,
        page: pageParam as number,
        limit,
        isActive: params.isActive,
      }),
    initialPageParam: 1,
    enabled: !!params.patientId,
    getNextPageParam: (lastPage, allPages) => {
      const items = (lastPage as Record<string, unknown>)?.items;
      const arr = Array.isArray(items) ? items : [];
      return arr.length < limit ? undefined : allPages.length + 1;
    },
  });
}
