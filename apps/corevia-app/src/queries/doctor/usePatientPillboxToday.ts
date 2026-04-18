import { useQuery } from '@tanstack/react-query';
import { useTrpc } from '@/providers/trpc';

export function usePatientPillboxToday(patientId: string, enabled = true) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.doctor.pillbox.todayByPatient.queryOptions({ patientId }),
    enabled: enabled && !!patientId,
  });
}
