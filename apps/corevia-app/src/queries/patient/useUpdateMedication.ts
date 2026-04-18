import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useUpdateMedication() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: {
      id: string;
      dosageLabel?: string | null;
      instructions?: string | null;
      startDate?: string;
      endDate?: string | null;
      isActive?: boolean;
    }) => trpcClient.pillbox.updateMedication.mutate(input),
    onSuccess: () => {
      toast.success(t('patient.pillbox.medicationUpdated', 'Medication updated'));
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
