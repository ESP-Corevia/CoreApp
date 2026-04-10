import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

export function useCreateMedication() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: {
      medicationName: string;
      medicationExternalId?: string | null;
      source?: string;
      cis?: string | null;
      cip?: string | null;
      dosageLabel?: string | null;
      instructions?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      schedules: Array<{
        intakeTime: string;
        intakeMoment?: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
        quantity?: string;
        weekday?: number | null;
        unit?: string | null;
        notes?: string | null;
      }>;
    }) => trpcClient.pillbox.createMedication.mutate(input),
    onSuccess: () => {
      toast.success(t('patient.pillbox.medicationCreated', 'Medication added'));
      void queryClient.invalidateQueries({ queryKey: ['patient', 'pillbox'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
