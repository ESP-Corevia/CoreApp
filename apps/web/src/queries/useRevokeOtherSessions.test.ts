import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { renderHook } from '@/test/renderHook';

import { useRevokeOtherSessions } from './useRevokeOtherSessions';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    revokeOtherSessions: vi.fn(),
  },
}));

describe('useRevokeOtherSessions', () => {
  it('calls revokeOtherSessions and shows success toast', async () => {
    (authClient.revokeOtherSessions as any).mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRevokeOtherSessions());
    result.current.mutate();
    await waitFor(() => {
      expect(authClient.revokeOtherSessions).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    (authClient.revokeOtherSessions as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useRevokeOtherSessions());
    result.current.mutate();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('boom'));
    });
  });
});
