import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

type PatientSummary = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
};

type ApptLike = { id?: string; patient?: PatientSummary | null };

function isDoctorAppointmentsKey(key: readonly unknown[]): boolean {
  if (!Array.isArray(key) || key.length === 0) return false;
  return key[0] === 'doctor' && key[1] === 'appointments';
}

export function useCachedPatientForAppointment(appointmentId: string | undefined): PatientSummary | undefined {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!appointmentId) return undefined;
    const entries = queryClient.getQueriesData<unknown>({
      predicate: q => isDoctorAppointmentsKey(q.queryKey),
    });

    for (const [, data] of entries) {
      if (!data) continue;
      const container = data as { pages?: Array<{ items?: ApptLike[] }>; items?: ApptLike[] };
      const items: ApptLike[] =
        container.pages?.flatMap(p => p.items ?? []) ?? container.items ?? [];
      const hit = items.find(a => a.id === appointmentId);
      if (hit?.patient) return hit.patient;
    }
    return undefined;
  }, [queryClient, appointmentId]);
}
