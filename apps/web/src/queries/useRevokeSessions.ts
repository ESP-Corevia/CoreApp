import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

export function useRevokeSessions() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.revokeSessions();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['list-sessions'] });
      toast.success(t('useRevokeSessions.success', 'All sessions revoked successfully'));
    },
    onError: error => {
      toast.error(
        t('useRevokeSessions.error', 'Failed to revoke all sessions: {{message}}', {
          message: error.message,
        })
      );
    },
  });
}
