import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

interface UpdateDoctorInput {
  userId: string;
  specialty?: string;
  address?: string;
  city?: string;
}

export function useUpdateDoctor() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: UpdateDoctorInput) => {
      return trpcClient.admin.updateDoctor.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('doctors.updated', 'Doctor profile updated successfully'));
      void queryClient.invalidateQueries(trpc.admin.listDoctors.queryFilter());
    },
    onError: error => {
      toast.error(
        t('doctors.updateError', 'Failed to update doctor: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
