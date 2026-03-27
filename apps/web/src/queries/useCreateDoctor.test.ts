import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useCreateDoctor } from './useCreateDoctor';

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
        createDoctor: {
          mutate: vi.fn(),
        },
      },
    },
  };
});

describe('useCreateDoctor', () => {
  it('calls mutate and shows success toast', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.createDoctor.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({
      id: 'doc-1',
      userId: 'user-1',
      specialty: 'Cardiology',
      address: '10 Rue Test',
      city: 'Paris',
    });

    const { result } = renderHook(() => useCreateDoctor());

    result.current.mutate({
      userId: 'user-1',
      specialty: 'Cardiology',
      address: '10 Rue Test',
      city: 'Paris',
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        userId: 'user-1',
        specialty: 'Cardiology',
        address: '10 Rue Test',
        city: 'Paris',
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.createDoctor.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('User role is "patient", expected "doctor"'));

    const { result } = renderHook(() => useCreateDoctor());

    result.current.mutate({
      userId: 'user-1',
      specialty: 'Cardiology',
      address: '10 Rue Test',
      city: 'Paris',
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('User role is "patient", expected "doctor"'),
      );
    });
  });
});
