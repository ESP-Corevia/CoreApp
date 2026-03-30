import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

interface UpdateAppointmentInput {
  id: string;
  date?: string;
  time?: string;
  reason?: string | null;
  doctorId?: string;
  patientId?: string;
}

export function useUpdateAppointment() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: UpdateAppointmentInput) => {
      return trpcClient.admin.updateAppointment.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('appointments.updated', 'Appointment updated successfully'));
      void queryClient.invalidateQueries(trpc.admin.listAppointments.queryFilter());
    },
    onError: error => {
      toast.error(
        t('appointments.updateError', 'Failed to update appointment: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
