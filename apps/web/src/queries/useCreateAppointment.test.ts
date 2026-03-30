import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useCreateAppointment } from './useCreateAppointment';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/providers/trpc', async importOriginal => {
  const original = await importOriginal<typeof import('@/providers/trpc')>();
  return {
    ...original,
    trpcClient: {
      admin: {
        createAppointment: {
          mutate: vi.fn(),
        },
      },
    },
  };
});

describe('useCreateAppointment', () => {
  it('calls mutate and shows success toast', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.createAppointment.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({
      id: 'appt-1',
      doctorId: 'doc-1',
      patientId: 'pat-1',
      date: '2099-06-15',
      time: '10:00',
      status: 'PENDING',
    });

    const { result } = renderHook(() => useCreateAppointment());

    result.current.mutate({
      doctorId: 'doc-1',
      patientId: 'pat-1',
      date: '2099-06-15',
      time: '10:00',
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        doctorId: 'doc-1',
        patientId: 'pat-1',
        date: '2099-06-15',
        time: '10:00',
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.createAppointment.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('This time slot is already booked'));

    const { result } = renderHook(() => useCreateAppointment());

    result.current.mutate({
      doctorId: 'doc-1',
      patientId: 'pat-1',
      date: '2099-06-15',
      time: '10:00',
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('This time slot is already booked'),
      );
    });
  });
});
