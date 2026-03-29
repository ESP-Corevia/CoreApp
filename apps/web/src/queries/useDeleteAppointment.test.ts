import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useDeleteAppointment } from './useDeleteAppointment';

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
        deleteAppointment: {
          mutate: vi.fn(),
        },
      },
    },
  };
});

describe('useDeleteAppointment', () => {
  it('calls mutate with id wrapped in object and shows success toast', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.deleteAppointment.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({
      id: 'appt-1',
      doctorId: 'doc-1',
      patientId: 'pat-1',
      date: '2099-06-15',
      time: '10:00',
      status: 'PENDING',
    });

    const { result } = renderHook(() => useDeleteAppointment());

    result.current.mutate('appt-1');

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ id: 'appt-1' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.deleteAppointment.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('Appointment not found'));

    const { result } = renderHook(() => useDeleteAppointment());

    result.current.mutate('appt-1');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete appointment');
    });
  });
});
