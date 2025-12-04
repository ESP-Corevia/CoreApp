import { useMutation } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

export function useImpersonateUser() {
  const { t } = useTranslation();
  return useMutation({
    onMutate: async () => {
      const popup = window.open('/', 'impersonation-window', 'popup=yes,width=1400,height=900');

      if (!popup) {
        toast.error(
          t('useImpersonateUser.popupBlocked', 'Popup blocked — allow popups to impersonate users.')
        );
        throw new Error('Popup blocked');
      }

      return { popup };
    },
    mutationFn: async (userId: string) => {
      await authClient.admin.impersonateUser({ userId });
    },

    onSuccess: async (_, __, context) => {
      const popup = context.popup;

      popup.location.href = '/';

      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          void authClient.admin.stopImpersonating();
        }
      }, 800);
    },

    onError: err => {
      toast.error(
        t('useImpersonateUser.failedToImpersonate', 'Failed to impersonate user: {{message}}', {
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      );
    },
  });
}
