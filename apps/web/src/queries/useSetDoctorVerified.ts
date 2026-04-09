import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

interface SetDoctorVerifiedInput {
  userId: string;
  verified: boolean;
}

export function useSetDoctorVerified() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: SetDoctorVerifiedInput) => {
      return trpcClient.admin.setDoctorVerified.mutate(input);
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.verified
          ? t('doctors.verified', 'Doctor verified successfully')
          : t('doctors.unverified', 'Doctor unverified successfully'),
      );
      void queryClient.invalidateQueries(trpc.admin.listDoctors.queryFilter());
    },
    onError: error => {
      toast.error(
        t('doctors.verifyError', 'Failed to update verification: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
