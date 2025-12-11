import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { renderHook } from '@/test/renderHook';

import { useRevokeSessions } from './useRevokeSessions';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    revokeSessions: vi.fn(),
  },
}));

describe('useRevokeSessions', () => {
  it('calls revokeSessions and shows success toast', async () => {
    (authClient.revokeSessions as any).mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRevokeSessions());
    result.current.mutate();
    await waitFor(() => {
      expect(authClient.revokeSessions).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    (authClient.revokeSessions as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useRevokeSessions());
    result.current.mutate();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('boom'));
    });
  });
});
