import { useMutation } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

export function useRevokeUserSessions() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (userId: string) => {
      await authClient.admin.revokeUserSessions({ userId });
    },
    onSuccess: () => {
      toast.success(t('useRevokeUserSessions.success', 'User sessions revoked successfully'));
    },
    onError: error => {
      toast.error(
        t('useRevokeUserSessions.error', 'Failed to revoke user sessions: {{message}}', {
          message: error.message,
        })
      );
    },
  });
}
