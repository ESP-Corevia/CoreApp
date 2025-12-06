import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

export function useRevokeSession() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      await authClient.revokeSession({ token });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['list-sessions'] });
      toast.success(t('useRevokeSession.success', 'Session revoked successfully'));
    },
    onError: error => {
      toast.error(
        t('useRevokeSession.error', 'Failed to revoke session: {{message}}', {
          message: error.message,
        })
      );
    },
  });
}
