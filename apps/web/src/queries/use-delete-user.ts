import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

import { adminQueryKeys } from './query-keys';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await authClient.admin.removeUser({ userId });
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
    onError: error => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });
}
