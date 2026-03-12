import { useQuery } from '@tanstack/react-query';

import { useTrpc } from '@/providers/trpc';

interface UseListDoctorsParams {
  page: number;
  perPage: number;
  search?: string;
  specialty?: string;
  city?: string;
  enabled?: boolean;
}

export function useListDoctors({
  page,
  perPage,
  search,
  specialty,
  city,
  enabled = true,
}: UseListDoctorsParams) {
  const trpc = useTrpc();

  return useQuery({
    ...trpc.admin.listDoctors.queryOptions({
      page,
      perPage,
      search,
      specialty,
      city,
    }),
    enabled,
  });
}
