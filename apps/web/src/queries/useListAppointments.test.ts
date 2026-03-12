import { waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useListAppointments } from './useListAppointments';

describe('useListAppointments', () => {
  const mockAppointments = {
    appointments: [
      {
        id: 'appt-1',
        doctorId: 'doc-1',
        patientId: 'pat-1',
        date: '2099-06-15',
        time: '10:00',
        status: 'PENDING',
        reason: 'Checkup',
        createdAt: '2099-06-01T00:00:00.000Z',
        doctorName: 'Dr. Smith',
        patientName: 'John Doe',
      },
    ],
    totalItems: 1,
    totalPages: 1,
    page: 1,
    perPage: 10,
  };

  it('should fetch appointments with correct params', async () => {
    const handler = vi.fn().mockResolvedValue(mockAppointments);

    const { result } = renderHook(
      () =>
        useListAppointments({
          page: 1,
          perPage: 10,
          status: 'PENDING',
          from: '2099-01-01',
          to: '2099-12-31',
          sort: 'dateDesc',
        }),
      {
        trpcHandlers: {
          'admin.listAppointments': handler,
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
      search: undefined,
      status: 'PENDING',
      from: '2099-01-01',
      to: '2099-12-31',
      doctorId: undefined,
      sort: 'dateDesc',
    });

    expect(result.current.data).toEqual(mockAppointments);
  });

  it('should not run query when enabled = false', async () => {
    const handler = vi.fn();

    const { result } = renderHook(
      () =>
        useListAppointments({
          page: 1,
          perPage: 10,
          enabled: false,
        }),
      {
        trpcHandlers: {
          'admin.listAppointments': handler,
        },
      }
    );

    expect(handler).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('returns error state if tRPC throws', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () =>
        useListAppointments({
          page: 1,
          perPage: 10,
        }),
      {
        trpcHandlers: {
          'admin.listAppointments': handler,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Server error');
  });
});
