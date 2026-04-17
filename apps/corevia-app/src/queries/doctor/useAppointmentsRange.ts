import { useQuery } from '@tanstack/react-query';
import { trpcClient } from '@/providers/trpc';

type Status = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

interface Params {
  status?: Status;
  from?: string;
  to?: string;
  sort?: 'dateAsc' | 'dateDesc' | 'createdAtDesc';
  limit?: number;
  refetchInterval?: number | false;
}

export function useDoctorAppointmentsRange(params: Params = {}) {
  const { status, from, to, sort = 'dateAsc', limit = 50, refetchInterval = 30_000 } = params;

  return useQuery({
    queryKey: ['doctor', 'appointments', 'range', { status, from, to, sort, limit }],
    queryFn: () =>
      trpcClient.doctor.appointments.listMine.query({
        page: 1,
        limit,
        status,
        from,
        to,
        sort,
      }),
    refetchInterval,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}
