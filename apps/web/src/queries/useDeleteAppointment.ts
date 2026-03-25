import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

export function useDeleteAppointment() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => {
      return trpcClient.admin.deleteAppointment.mutate({ id });
    },
    onSuccess: () => {
      toast.success(t('appointments.deleted', 'Appointment deleted successfully'));
      void queryClient.invalidateQueries(trpc.admin.listAppointments.queryFilter());
    },
    onError: error => {
      toast.error(
        t('appointments.deleteError', 'Failed to delete appointment: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
