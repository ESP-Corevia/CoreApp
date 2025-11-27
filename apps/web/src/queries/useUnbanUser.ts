import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

export function useUnbanUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const trpc = useTrpc();
  return useMutation({
    mutationFn: async (userId: string) => {
      await authClient.admin.unbanUser({ userId });
    },
    onSuccess: () => {
      toast.success(t('useUnbanUser.success', 'User unbanned successfully'));
      void queryClient.invalidateQueries(trpc.admin.listUsers.queryFilter());
    },
    onError: error => {
      toast.error(
        t('useUnbanUser.error', 'Failed to unban user: {{message}}', { message: error.message })
      );
    },
  });
}
