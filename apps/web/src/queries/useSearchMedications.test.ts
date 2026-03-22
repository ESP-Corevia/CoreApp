import { waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useSearchMedications } from './useSearchMedications';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});
describe('useSearchMedications', () => {
  it('should fetch medications based on search query', async () => {
    const handler = vi.fn().mockResolvedValue({
      items: [{ id: '1', name: 'DOLIPRANE 500mg' }],
      total: 1,
      page: 1,
      limit: 12,
    });

    const { result } = renderHook(
      () =>
        useSearchMedications({
          query: 'doli',
          page: 1,
          limit: 12,
          enabled: true,
        }),
      {
        trpcHandlers: {
          'medications.search': handler,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(handler).toHaveBeenCalledWith({ query: 'doli', page: 1, limit: 12 });
    });

    expect(result.current.data).toEqual({
      items: [{ id: '1', name: 'DOLIPRANE 500mg' }],
      total: 1,
      page: 1,
      limit: 12,
    });
  });

  it('should not fetch medications if query is less than 3 characters', async () => {
    const handler = vi.fn();

    renderHook(
      () =>
        useSearchMedications({
          query: 'do',
          page: 1,
          limit: 12,
          enabled: true,
        }),
      {
        trpcHandlers: {
          'medications.search': handler,
        },
      }
    );

    await waitFor(() => {
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it('should not fetch medications if enabled is false', async () => {
    const handler = vi.fn();

    renderHook(
      () =>
        useSearchMedications({
          query: 'doli',
          page: 1,
          limit: 12,
          enabled: false,
        }),
      {
        trpcHandlers: {
          'medications.search': handler,
        },
      }
    );

    await waitFor(() => {
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
