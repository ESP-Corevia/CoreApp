import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useMarkIntakeTaken() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: { id: string; notes?: string | null }) =>
      trpcClient.pillbox.markIntakeTaken.mutate(input),
    onSuccess: () => {
      toast.success(t('patient.pillbox.intakeTaken', 'Intake marked as taken'));
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox', 'today'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
