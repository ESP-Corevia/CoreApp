import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

export function useUpdateAppointmentStatus() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: {
      id: string;
      status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    }) => {
      return trpcClient.admin.updateAppointmentStatus.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('appointments.statusUpdated', 'Appointment status updated successfully'));
      void queryClient.invalidateQueries(trpc.admin.listAppointments.queryFilter());
    },
    onError: error => {
      toast.error(
        t('appointments.statusUpdateError', 'Failed to update status: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
