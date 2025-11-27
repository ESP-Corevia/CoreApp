import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const trpc = useTrpc();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (userId: string) => {
      await authClient.admin.removeUser({ userId });
    },
    onSuccess: () => {
      toast.success(t('userDeletedQuery.success', 'User deleted successfully'));
      void queryClient.invalidateQueries(trpc.admin.listUsers.queryFilter());
    },
    onError: error => {
      toast.error(
        t('userDeletedQuery.error', 'Failed to delete user: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    },
  });
}
