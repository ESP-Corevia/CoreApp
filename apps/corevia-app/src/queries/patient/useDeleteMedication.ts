import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useDeleteMedication() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: { id: string }) => trpcClient.pillbox.deleteMedication.mutate(input),
    onSuccess: () => {
      toast.success(t('patient.pillbox.medicationDeleted', 'Medication deleted'));
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox'] });
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox', 'today'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
