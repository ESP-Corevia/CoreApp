import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

interface CreateDoctorInput {
  userId: string;
  specialty: string;
  address: string;
  city: string;
}

export function useCreateDoctor() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: CreateDoctorInput) => {
      return trpcClient.admin.createDoctor.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('doctors.created', 'Doctor profile created successfully'));
      void queryClient.invalidateQueries(trpc.admin.listDoctors.queryFilter());
    },
    onError: error => {
      toast.error(
        t('doctors.createError', 'Failed to create doctor: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
