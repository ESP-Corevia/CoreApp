import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useSetDoctorVerified } from './useSetDoctorVerified';

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
        setDoctorVerified: {
          mutate: vi.fn(),
        },
      },
    },
  };
});

describe('useSetDoctorVerified', () => {
  it('calls mutate and shows success toast when verifying', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.setDoctorVerified.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({
      id: 'doc-1',
      userId: 'user-1',
      specialty: 'Cardiology',
      address: '10 Rue Test',
      city: 'Paris',
      verified: true,
    });

    const { result } = renderHook(() => useSetDoctorVerified());

    result.current.mutate({
      userId: 'user-1',
      verified: true,
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        userId: 'user-1',
        verified: true,
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.setDoctorVerified.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('Doctor profile not found'));

    const { result } = renderHook(() => useSetDoctorVerified());

    result.current.mutate({
      userId: 'user-1',
      verified: true,
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Doctor profile not found'));
    });
  });
});
