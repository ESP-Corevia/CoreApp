import { useQuery } from '@tanstack/react-query';

import { useTrpc } from '@/providers/trpc';

interface UseListPatientsParams {
  page: number;
  perPage: number;
  search?: string;
  gender?: 'MALE' | 'FEMALE';
  enabled?: boolean;
}

export function useListPatients({
  page,
  perPage,
  search,
  gender,
  enabled = true,
}: UseListPatientsParams) {
  const trpc = useTrpc();

  return useQuery({
    ...trpc.admin.listPatients.queryOptions({
      page,
      perPage,
      search,
      gender,
    }),
    enabled,
  });
}
