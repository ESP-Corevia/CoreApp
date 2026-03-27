import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

export function useCreatePatient() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: {
      userId: string;
      dateOfBirth: string;
      gender: 'MALE' | 'FEMALE';
      phone?: string | null;
      address?: string | null;
      bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null;
      allergies?: string | null;
      emergencyContactName?: string | null;
      emergencyContactPhone?: string | null;
    }) => {
      return trpcClient.admin.createPatient.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('patients.created', 'Patient profile created successfully'));
      void queryClient.invalidateQueries(trpc.admin.listPatients.queryFilter());
    },
    onError: error => {
      toast.error(
        t('patients.createError', 'Failed to create patient: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
