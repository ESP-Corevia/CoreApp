import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

export function useRevokeOtherSessions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.revokeOtherSessions();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['list-sessions'] });
      toast.success(t('useRevokeOtherSessions.success', 'Other sessions revoked successfully'));
    },
    onError: error => {
      toast.error(
        t('useRevokeOtherSessions.error', 'Failed to revoke other sessions: {{message}}', {
          message: error.message,
        })
      );
    },
  });
}
