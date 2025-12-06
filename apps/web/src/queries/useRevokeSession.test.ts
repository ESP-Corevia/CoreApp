import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { renderHook } from '@/test/renderHook';

import { useRevokeSession } from './useRevokeSession';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    revokeSession: vi.fn(),
  },
}));

describe('useRevokeSession', () => {
  it('calls revokeSession and shows success toast', async () => {
    (authClient.revokeSession as any).mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRevokeSession());
    result.current.mutate('test-token-123');
    await waitFor(() => {
      expect(authClient.revokeSession).toHaveBeenCalledWith({ token: 'test-token-123' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    (authClient.revokeSession as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useRevokeSession());
    result.current.mutate('test-token-123');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('boom'));
    });
  });
});
