/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useListPatients } from './useListPatients';

vi.mock('@/providers/trpc', async importOriginal => {
  const original = await importOriginal<typeof import('@/providers/trpc')>();
  return {
    ...original,
    trpcClient: {
      admin: {
        listPatients: {
          query: vi.fn(),
        },
      },
    },
  };
});

describe('useListPatients', () => {
  it('returns a query result object', () => {
    const { result } = renderHook(() => useListPatients({ page: 1, perPage: 10, enabled: false }));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });

  it('is disabled when enabled is false', () => {
    const { result } = renderHook(() => useListPatients({ page: 1, perPage: 10, enabled: false }));

    expect(result.current.isFetching).toBe(false);
  });
});
