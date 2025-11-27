import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useRequireAuth, useGuestOnly } from './use-require-auth';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/dashboard', search: '' };

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const mockUseSession = vi.fn();
const mockAdminHasPermission = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => mockUseSession(),
    admin: {
      hasPermission: () => mockAdminHasPermission(),
    },
  },
}));

describe('useRequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state when session is pending', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    const { result } = renderHook(() => useRequireAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.session).toBe(null);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { isAuthenticated: false },
      isPending: false,
    });

    renderHook(() => useRequireAuth());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?redirectTo=%2Fdashboard', {
        replace: true,
      });
    });
  });

  it('should not redirect when authenticated', async () => {
    mockAdminHasPermission.mockReturnValue({ data: { success: true, error: null } });
    mockUseSession.mockReturnValue({
      data: {
        isAuthenticated: true,
        user: { id: '1', name: 'John' },
      },
      isPending: false,
    });

    const { result } = renderHook(() => useRequireAuth());

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(result.current.session?.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should return session data when authenticated', async () => {
    const mockSession = {
      isAuthenticated: true,
      user: { id: '1', name: 'John', email: 'john@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      isPending: false,
    });
    mockAdminHasPermission.mockReturnValue({ data: { success: true } });
    const { result } = renderHook(() => useRequireAuth());
    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should redirect when session becomes null', async () => {
    const { rerender } = renderHook(() => useRequireAuth());

    mockUseSession.mockReturnValue({
      data: { isAuthenticated: true },
      isPending: false,
    });
    rerender();

    expect(mockNavigate).not.toHaveBeenCalled();

    mockUseSession.mockReturnValue({
      data: { isAuthenticated: false },
      isPending: false,
    });
    rerender();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?redirectTo=%2Fdashboard', {
        replace: true,
      });
    });
  });
  it('should redirect to 403 when permission is denied', async () => {
    mockUseSession.mockReturnValue({
      data: {
        isAuthenticated: true,
        user: { id: '1', name: 'John' },
      },
      isPending: false,
    });
    mockAdminHasPermission.mockReturnValue({ data: { success: false } });

    renderHook(() => useRequireAuth());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/403', {
        replace: true,
        state: { from: '/dashboard' },
      });
    });
  });
});

describe('useGuestOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state when session is pending', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    const { result } = renderHook(() => useGuestOnly());

    expect(result.current.isLoading).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should redirect to home when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: {
        isAuthenticated: true,
        user: { id: '1', name: 'John' },
      },
      isPending: false,
    });

    renderHook(() => useGuestOnly());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should not redirect when not authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { isAuthenticated: false },
      isPending: false,
    });

    const { result } = renderHook(() => useGuestOnly());

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should redirect when user logs in', async () => {
    const { rerender } = renderHook(() => useGuestOnly());

    mockUseSession.mockReturnValue({
      data: { isAuthenticated: false },
      isPending: false,
    });
    rerender();

    expect(mockNavigate).not.toHaveBeenCalled();

    mockUseSession.mockReturnValue({
      data: { isAuthenticated: true },
      isPending: false,
    });
    rerender();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should handle null session data', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    const { result } = renderHook(() => useGuestOnly());

    expect(result.current.isLoading).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
