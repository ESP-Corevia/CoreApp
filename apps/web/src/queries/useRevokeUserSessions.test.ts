import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { renderHook } from '@/test/renderHook';

import { useRevokeUserSessions } from './useRevokeUserSessions';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      revokeUserSessions: vi.fn(),
    },
  },
}));

describe('useRevokeUserSessions', () => {
  it('calls revokeUserSessions and shows success toast', async () => {
    (authClient.admin.revokeUserSessions as any).mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRevokeUserSessions());
    result.current.mutate('123');
    await waitFor(() => {
      expect(authClient.admin.revokeUserSessions).toHaveBeenCalledWith({ userId: '123' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    (authClient.admin.revokeUserSessions as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useRevokeUserSessions());
    result.current.mutate('123');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('boom'));
    });
  });
});
