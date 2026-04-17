import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useDeleteSchedule(medicationId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: { id: string }) => trpcClient.pillbox.deleteSchedule.mutate(input),
    onSuccess: () => {
      toast.success(t('patient.pillbox.scheduleDeleted', 'Schedule deleted'));
      void queryClient.invalidateQueries({
        queryKey: ['patient', 'pillbox', 'detail', medicationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox', 'today'] });
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
