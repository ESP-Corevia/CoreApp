import { waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';
import type { ExtendedColumnFilter, User, ExtendedColumnSort } from '@/types/data-table';

import { useListUsers } from './useListUsers';

describe('useListUsers', () => {
  const mockUsers = {
    items: [{ id: '1', name: 'John Doe', role: 'admin' }],
    total: 2,
  };

  it('should fetch users with correct params', async () => {
    const handler = vi.fn().mockResolvedValue(mockUsers);

    const { result } = renderHook(
      () =>
        useListUsers({
          page: 1,
          perPage: 20,
          search: 'john',
          searchInFields: ['name'],
          sorting: { id: 'name', desc: false } as ExtendedColumnSort<User>,
          filters: [{ id: 'role', value: 'admin' }] as ExtendedColumnFilter<User>[],
        }),
      {
        trpcHandlers: {
          'admin.listUsers': handler,
        },
      }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(handler).toHaveBeenCalledWith({
      page: 1,
      perPage: 20,
      search: 'john',
      searchInFields: ['name'],
      sorting: JSON.stringify({ id: 'name', desc: false }),
      filters: JSON.stringify([{ id: 'role', value: 'admin' }]),
    });

    expect(result.current.data).toEqual(mockUsers);
  });

  it('should not run query when enabled = false', async () => {
    const handler = vi.fn();

    const { result } = renderHook(
      () =>
        useListUsers({
          page: 1,
          perPage: 10,
          search: '',
          sorting: {} as ExtendedColumnSort<User>,
          enabled: false,
        }),
      {
        trpcHandlers: {
          'admin.listUsers': handler,
        },
      }
    );

    expect(handler).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('returns error state if TRPC throws', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(
      () =>
        useListUsers({
          page: 1,
          perPage: 10,
          search: '',
          sorting: {} as ExtendedColumnSort<User>,
        }),
      {
        trpcHandlers: {
          'admin.listUsers': handler,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed');
  });
});
