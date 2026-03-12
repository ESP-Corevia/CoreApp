import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useUpdateAppointmentStatus } from './useUpdateAppointmentStatus';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/providers/trpc', async importOriginal => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import('@/providers/trpc')>();
  return {
    ...original,
    trpcClient: {
      admin: {
        updateAppointmentStatus: {
          mutate: vi.fn(),
        },
      },
    },
  };
});

describe('useUpdateAppointmentStatus', () => {
  it('calls mutate and shows success toast', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.updateAppointmentStatus.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({
      id: 'appt-1',
      doctorId: 'doc-1',
      patientId: 'pat-1',
      date: '2099-06-15',
      time: '10:00',
      status: 'CONFIRMED',
    });

    const { result } = renderHook(() => useUpdateAppointmentStatus());

    result.current.mutate({ id: 'appt-1', status: 'CONFIRMED' });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ id: 'appt-1', status: 'CONFIRMED' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.updateAppointmentStatus.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('Transition not allowed'));

    const { result } = renderHook(() => useUpdateAppointmentStatus());

    result.current.mutate({ id: 'appt-1', status: 'CONFIRMED' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Transition not allowed'));
    });
  });
});
