import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useUpdateSchedule(medicationId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: {
      id: string;
      weekday?: number | null;
      intakeTime?: string;
      intakeMoment?: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
      quantity?: string;
      unit?: string | null;
      notes?: string | null;
    }) => trpcClient.pillbox.updateSchedule.mutate(input),
    onSuccess: () => {
      toast.success(t('patient.pillbox.scheduleUpdated', 'Schedule updated'));
      void queryClient.invalidateQueries({
        queryKey: ['patient', 'pillbox', 'detail', medicationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
