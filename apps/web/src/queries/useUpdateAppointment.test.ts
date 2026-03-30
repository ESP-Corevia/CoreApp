import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useUpdateAppointment } from './useUpdateAppointment';

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
        updateAppointment: {
          mutate: vi.fn(),
        },
      },
    },
  };
});

describe('useUpdateAppointment', () => {
  it('calls mutate and shows success toast', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.updateAppointment.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({
      id: 'appt-1',
      doctorId: 'doc-1',
      patientId: 'pat-1',
      date: '2099-07-01',
      time: '14:00',
      status: 'PENDING',
      reason: 'Follow-up',
    });

    const { result } = renderHook(() => useUpdateAppointment());

    result.current.mutate({
      id: 'appt-1',
      date: '2099-07-01',
      time: '14:00',
      reason: 'Follow-up',
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        id: 'appt-1',
        date: '2099-07-01',
        time: '14:00',
        reason: 'Follow-up',
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.updateAppointment.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('Appointment not found'));

    const { result } = renderHook(() => useUpdateAppointment());

    result.current.mutate({ id: 'appt-1', reason: 'Updated' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Appointment not found'));
    });
  });
});
