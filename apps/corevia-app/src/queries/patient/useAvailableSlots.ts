import { useQuery } from '@tanstack/react-query';
import { useTrpc } from '@/providers/trpc';

export function useAvailableSlots(params: { doctorId: string; date: string }, enabled = true) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.doctors.availableSlots.queryOptions(params),
    enabled: enabled && !!params.doctorId && !!params.date,
  });
}
