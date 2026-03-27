import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import { useCreatePatient } from './useCreatePatient';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/providers/trpc', async importOriginal => {
  const original = await importOriginal<typeof import('@/providers/trpc')>();
  return {
    ...original,
    trpcClient: {
      admin: {
        createPatient: { mutate: vi.fn() },
      },
    },
  };
});

describe('useCreatePatient', () => {
  it('calls mutate and shows success toast', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.createPatient.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockResolvedValueOnce({ id: 'pat-1', userId: 'user-1' });

    const { result } = renderHook(() => useCreatePatient());

    result.current.mutate({
      userId: 'user-1',
      dateOfBirth: '1990-05-20',
      gender: 'MALE',
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        userId: 'user-1',
        dateOfBirth: '1990-05-20',
        gender: 'MALE',
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const { trpcClient } = await import('@/providers/trpc');
    const mockMutate = trpcClient.admin.createPatient.mutate as ReturnType<typeof vi.fn>;
    mockMutate.mockRejectedValueOnce(new Error('User role is "doctor", expected "patient"'));

    const { result } = renderHook(() => useCreatePatient());

    result.current.mutate({ userId: 'user-1', dateOfBirth: '1990-05-20', gender: 'MALE' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('User role is "doctor", expected "patient"'),
      );
    });
  });
});
