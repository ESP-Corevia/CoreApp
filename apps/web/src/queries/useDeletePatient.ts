import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

export function useDeletePatient() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (userId: string) => {
      return trpcClient.admin.deletePatient.mutate({ userId });
    },
    onSuccess: () => {
      toast.success(t('patients.deleted', 'Patient profile deleted successfully'));
      void queryClient.invalidateQueries(trpc.admin.listPatients.queryFilter());
    },
    onError: error => {
      toast.error(
        t('patients.deleteError', 'Failed to delete patient: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
