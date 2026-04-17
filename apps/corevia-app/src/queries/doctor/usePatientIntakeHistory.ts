import { useQuery } from '@tanstack/react-query';
import { useTrpc } from '@/providers/trpc';

export function useDoctorPatientIntakeHistory(patientId: string, from: string, to: string) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.doctor.pillbox.intakeHistory.queryOptions({ patientId, from, to }),
    enabled: !!patientId && !!from && !!to,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
