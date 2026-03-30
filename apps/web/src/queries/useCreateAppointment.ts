import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

interface CreateAppointmentInput {
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  reason?: string;
}

export function useCreateAppointment() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => {
      return trpcClient.admin.createAppointment.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('appointments.created', 'Appointment created successfully'));
      void queryClient.invalidateQueries(trpc.admin.listAppointments.queryFilter());
    },
    onError: error => {
      toast.error(
        t('appointments.createError', 'Failed to create appointment: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
