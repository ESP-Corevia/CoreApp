import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { renderHook } from '@/test/renderHook';

import { useDeleteUser } from './useDeleteUser';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      removeUser: vi.fn(),
    },
  },
}));

describe('useDeleteUser', () => {
  it('calls removeUser and shows success toast', async () => {
    (authClient.admin.removeUser as any).mockResolvedValueOnce('success');

    const { result } = renderHook(() => useDeleteUser());
    result.current.mutate('123');
    await waitFor(() => {
      expect(authClient.admin.removeUser).toHaveBeenCalledWith({ userId: '123' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    (authClient.admin.removeUser as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useDeleteUser());
    result.current.mutate('123');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('boom'));
    });
  });
});
