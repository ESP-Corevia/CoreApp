import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { renderHook } from '@/test/renderHook';

import { useUnbanUser } from './useUnbanUser';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      unbanUser: vi.fn(),
    },
  },
}));

describe('useUnbanUser', () => {
  it('calls unbanUser and shows success toast', async () => {
    (authClient.admin.unbanUser as any).mockResolvedValueOnce('success');

    const { result } = renderHook(() => useUnbanUser());
    result.current.mutate('123');
    await waitFor(() => {
      expect(authClient.admin.unbanUser).toHaveBeenCalledWith({ userId: '123' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    (authClient.admin.unbanUser as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useUnbanUser());
    result.current.mutate('123');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('boom'));
    });
  });
});
