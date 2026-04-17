import { useQuery } from '@tanstack/react-query';
import { useTrpc } from '@/providers/trpc';

export function useAppointmentDetail(id: string, enabled = true) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.doctor.appointments.detail.queryOptions({ id }),
    enabled: enabled && !!id,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}
