import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

export function useUpdatePatient() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: {
      userId: string;
      dateOfBirth?: string;
      gender?: 'MALE' | 'FEMALE';
      phone?: string | null;
      address?: string | null;
      bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null;
      allergies?: string | null;
      emergencyContactName?: string | null;
      emergencyContactPhone?: string | null;
    }) => {
      return trpcClient.admin.updatePatient.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('patients.updated', 'Patient profile updated successfully'));
      void queryClient.invalidateQueries(trpc.admin.listPatients.queryFilter());
    },
    onError: error => {
      toast.error(
        t('patients.updateError', 'Failed to update patient: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
