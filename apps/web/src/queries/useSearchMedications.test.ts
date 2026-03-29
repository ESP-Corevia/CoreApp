import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/providers/trpc', async importOriginal => {
  const actual = await importOriginal<typeof import('@/providers/trpc')>();
  return {
    ...actual,
    trpcClient: {
      medications: {
        search: {
          query: vi.fn(),
        },
      },
    },
  };
});

import { trpcClient } from '@/providers/trpc';
import { useSearchMedications } from './useSearchMedications';

const mockQuery = trpcClient.medications.search.query as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useSearchMedications', () => {
  it('should fetch medications based on search query', async () => {
    mockQuery.mockResolvedValue({
      items: [{ id: '1', name: 'DOLIPRANE 500mg' }],
      total: 1,
      page: 1,
      limit: 12,
    });

    const { result } = renderHook(() =>
      useSearchMedications({
        query: 'doli',
        limit: 12,
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockQuery).toHaveBeenCalledWith({ query: 'doli', page: 1, limit: 12 });
    expect(result.current.data?.pages[0]).toEqual({
      items: [{ id: '1', name: 'DOLIPRANE 500mg' }],
      total: 1,
      page: 1,
      limit: 12,
    });
  });

  it('should not fetch medications if query is less than 3 characters', async () => {
    renderHook(() =>
      useSearchMedications({
        query: 'do',
        limit: 12,
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  it('should not fetch medications if enabled is false', async () => {
    renderHook(() =>
      useSearchMedications({
        query: 'doli',
        limit: 12,
        enabled: false,
      }),
    );

    await waitFor(() => {
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
