import { waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { renderHook } from '@/test/renderHook';

import { useListSessions } from './useListSessions';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    listSessions: vi.fn(),
  },
}));

describe('useListSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return sessions when authClient returns { data: ... }', async () => {
    const mockResponse = {
      data: [
        { id: 'a', device: 'Chrome', createdAt: '2024-01-01' },
        { id: 'b', device: 'Safari', createdAt: '2024-01-02' },
      ],
    };

    (authClient.listSessions as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useListSessions());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse.data);
    expect(authClient.listSessions).toHaveBeenCalledTimes(1);
  });

  it('should return raw response if no "data" key exists', async () => {
    const mockResponse = [{ id: 'x', device: 'Edge', createdAt: '2024-02-01' }];

    (authClient.listSessions as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useListSessions());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it('should handle errors correctly', async () => {
    (authClient.listSessions as any).mockRejectedValueOnce(new Error('Boom'));

    const { result } = renderHook(() => useListSessions());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Boom');
  });
});
