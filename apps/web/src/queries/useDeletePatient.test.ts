import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useDeletePatient } from './useDeletePatient';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/providers/trpc', async importOriginal => {
  const original = await importOriginal<typeof import('@/providers/trpc')>();
  return {
    ...original,
    trpcClient: {
      admin: {
        deletePatient: { mutate: vi.fn() },
      },
    },
  };
});

describe('useDeletePatient', () => {
  it('calls mutate with userId and shows success toast', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.deletePatient.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({ id: 'pat-1' });

    const { result } = renderHook(() => useDeletePatient());

    result.current.mutate('user-1');

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.deletePatient.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('Patient profile not found'));

    const { result } = renderHook(() => useDeletePatient());

    result.current.mutate('user-1');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Patient profile not found'),
      );
    });
  });
});
