import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

import { adminQueryKeys } from './query-keys';

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await authClient.admin.unbanUser({ userId });
    },
    onSuccess: () => {
      toast.success('User unbanned successfully');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
    onError: error => {
      toast.error(`Failed to unban user: ${error.message}`);
    },
  });
}
