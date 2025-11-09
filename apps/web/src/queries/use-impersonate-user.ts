import { useMutation } from '@tanstack/react-query';

import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      await authClient.admin.impersonateUser({ userId });
    },
    onSuccess: () => {
      toast.success('Now impersonating user. Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: error => {
      toast.error(`Failed to impersonate user: ${error.message}`);
    },
  });
}
