import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { renderHook } from '@/test/renderHook';

import { useImpersonateUser } from './useImpersonateUser';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      impersonateUser: vi.fn(),
      stopImpersonating: vi.fn(),
    },
  },
}));

describe('useImpersonateUser', () => {
  let mockPopup: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPopup = {
      location: { href: '' },
      closed: false,
      close: vi.fn(),
    };

    global.window.open = vi.fn(() => mockPopup);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should open a popup on mutate', async () => {
    const { result } = renderHook(() => useImpersonateUser());

    result.current.mutate('user-123');

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        '/',
        'impersonation-window',
        'popup=yes,width=1400,height=900'
      );
    });
  });

  it('should show error toast when popup is blocked', async () => {
    global.window.open = vi.fn(() => null);

    const { result } = renderHook(() => useImpersonateUser());

    result.current.mutate('user-123');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Popup blocked'));
    });
  });

  it('should call impersonateUser with correct userId', async () => {
    (authClient.admin.impersonateUser as any).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useImpersonateUser());

    result.current.mutate('user-456');

    await waitFor(() => {
      expect(authClient.admin.impersonateUser).toHaveBeenCalledWith({ userId: 'user-456' });
    });
  });

  it('should navigate popup to / on success', async () => {
    (authClient.admin.impersonateUser as any).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useImpersonateUser());

    result.current.mutate('user-789');

    await waitFor(() => {
      expect(mockPopup.location.href).toBe('/');
    });
  });

  it('should stop impersonating when popup closes', async () => {
    (authClient.admin.impersonateUser as any).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useImpersonateUser());

    result.current.mutate('user-000');

    await waitFor(() => {
      expect(mockPopup.location.href).toBe('/');
    });

    expect(authClient.admin.stopImpersonating).not.toHaveBeenCalled();

    mockPopup.closed = true;

    await waitFor(() => {
      expect(authClient.admin.stopImpersonating).toHaveBeenCalled();
    });
  });

  it('should show error toast on mutation failure', async () => {
    const error = new Error('Impersonation failed');
    (authClient.admin.impersonateUser as any).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useImpersonateUser());

    result.current.mutate('user-failed');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to impersonate user')
      );
    });
  });

  it('should handle unknown error in onError', async () => {
    (authClient.admin.impersonateUser as any).mockRejectedValueOnce('Unknown error');

    const { result } = renderHook(() => useImpersonateUser());

    result.current.mutate('user-error');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    });
  });

  it('should continue checking popup status after multiple intervals', async () => {
    (authClient.admin.impersonateUser as any).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useImpersonateUser());

    result.current.mutate('user-check');

    await waitFor(() => {
      expect(mockPopup.location.href).toBe('/');
    });

    await new Promise(res => setTimeout(res, 850));
    expect(authClient.admin.stopImpersonating).not.toHaveBeenCalled();

    await new Promise(res => setTimeout(res, 850));
    expect(authClient.admin.stopImpersonating).not.toHaveBeenCalled();

    mockPopup.closed = true;

    await new Promise(res => setTimeout(res, 850));

    expect(authClient.admin.stopImpersonating).toHaveBeenCalled();
  });
});
