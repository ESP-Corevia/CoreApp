import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

function matchesDoctorAppointments(key: readonly unknown[]): boolean {
  if (!Array.isArray(key) || key.length === 0) return false;
  const head = key[0];
  if (Array.isArray(head)) {
    return head[0] === 'doctor' && head[1] === 'appointments';
  }
  return head === 'doctor' && key[1] === 'appointments';
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: { id: string; status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }) =>
      trpcClient.doctor.appointments.updateStatus.mutate(input),
    onSuccess: () => {
      toast.success(t('doctor.appointments.statusUpdated', 'Appointment status updated'));
      void queryClient.invalidateQueries({
        predicate: q => matchesDoctorAppointments(q.queryKey),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
