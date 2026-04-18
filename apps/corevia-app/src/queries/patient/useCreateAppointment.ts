import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: { doctorId: string; date: string; time: string; reason?: string }) =>
      trpcClient.appointments.create.mutate(input),
    onSuccess: () => {
      toast.success(t('patient.appointments.created', 'Appointment booked'));
      void queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
