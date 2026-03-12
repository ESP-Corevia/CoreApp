import { waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useListDoctors } from './useListDoctors';

describe('useListDoctors', () => {
  const mockDoctors = {
    doctors: [
      {
        id: 'doc-1',
        userId: 'user-1',
        specialty: 'Cardiology',
        address: '10 Rue de Rivoli',
        city: 'Paris',
        name: 'Dr. Smith',
        email: 'smith@example.com',
        image: null,
      },
    ],
    totalItems: 1,
    totalPages: 1,
    page: 1,
    perPage: 10,
  };

  it('should fetch doctors with correct params', async () => {
    const handler = vi.fn().mockResolvedValue(mockDoctors);

    const { result } = renderHook(
      () =>
        useListDoctors({
          page: 1,
          perPage: 10,
          search: 'smith',
          specialty: 'Cardiology',
          city: 'Paris',
        }),
      {
        trpcHandlers: {
          'admin.listDoctors': handler,
        },
      }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(handler).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      search: 'smith',
      specialty: 'Cardiology',
      city: 'Paris',
    });

    expect(result.current.data).toEqual(mockDoctors);
  });

  it('should not run query when enabled = false', async () => {
    const handler = vi.fn();

    const { result } = renderHook(
      () =>
        useListDoctors({
          page: 1,
          perPage: 10,
          enabled: false,
        }),
      {
        trpcHandlers: {
          'admin.listDoctors': handler,
        },
      }
    );

    expect(handler).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('returns error state if tRPC throws', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(
      () =>
        useListDoctors({
          page: 1,
          perPage: 10,
        }),
      {
        trpcHandlers: {
          'admin.listDoctors': handler,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed');
  });
});
