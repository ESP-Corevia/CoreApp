import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useUpdateDoctor } from './useUpdateDoctor';

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
        updateDoctor: {
          mutate: vi.fn(),
        },
      },
    },
  };
});

describe('useUpdateDoctor', () => {
  it('calls mutate and shows success toast', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.updateDoctor.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({
      id: 'doc-1',
      userId: 'user-1',
      specialty: 'Oncology',
      address: '10 Rue Test',
      city: 'Lyon',
    });

    const { result } = renderHook(() => useUpdateDoctor());

    result.current.mutate({
      userId: 'user-1',
      specialty: 'Oncology',
      city: 'Lyon',
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        userId: 'user-1',
        specialty: 'Oncology',
        city: 'Lyon',
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.updateDoctor.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('Doctor profile not found'));

    const { result } = renderHook(() => useUpdateDoctor());

    result.current.mutate({
      userId: 'user-1',
      specialty: 'Oncology',
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Doctor profile not found'));
    });
  });
});
