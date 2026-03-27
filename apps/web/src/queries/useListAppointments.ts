import { useQuery } from '@tanstack/react-query';

import { useTrpc } from '@/providers/trpc';

interface UseListAppointmentsParams {
  page: number;
  perPage: number;
  search?: string;
  status?: ('PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED')[];
  from?: string;
  to?: string;
  doctorId?: string;
  sort?: 'dateAsc' | 'dateDesc' | 'createdAtDesc';
  enabled?: boolean;
}

export function useListAppointments({
  page,
  perPage,
  search,
  status,
  from,
  to,
  doctorId,
  sort,
  enabled = true,
}: UseListAppointmentsParams) {
  const trpc = useTrpc();

  return useQuery({
    ...trpc.admin.listAppointments.queryOptions({
      page,
      perPage,
      search,
      status,
      from,
      to,
      doctorId,
      sort,
    }),
    enabled,
  });
}
