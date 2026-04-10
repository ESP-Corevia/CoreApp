import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useAddSchedule() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: {
      patientMedicationId: string;
      intakeTime: string;
      intakeMoment?: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
      quantity?: string;
      weekday?: number | null;
      unit?: string | null;
      notes?: string | null;
    }) => trpcClient.pillbox.addSchedule.mutate(input),
    onSuccess: (_data, variables) => {
      toast.success(t('patient.pillbox.scheduleAdded', 'Schedule added'));
      void queryClient.invalidateQueries({
        queryKey: ['patient', 'pillbox', 'detail', variables.patientMedicationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
