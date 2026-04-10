import { useQuery } from '@tanstack/react-query';
import { useTrpc } from '@/providers/trpc';

export function useMedicationDetail(id: string, enabled = true) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.doctor.pillbox.medicationDetail.queryOptions({ id }),
    enabled: enabled && !!id,
  });
}
