import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: { id: string; status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }) =>
      trpcClient.doctor.appointments.updateStatus.mutate(input),
    onSuccess: (_data, variables) => {
      toast.success(t('doctor.appointments.statusUpdated', 'Appointment status updated'));
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] });
      void queryClient.invalidateQueries({
        queryKey: ['doctor', 'appointments', 'detail', variables.id],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
