/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@/test/renderHook';

import {
  useAddSchedule,
  useAdminCreateMedication,
  useAdminDeleteMedication,
  useAdminPillboxList,
  useAdminUpdateMedication,
  useDeleteSchedule,
  usePillboxDetail,
  useUpdateSchedule,
} from './usePillbox';

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
      pillbox: {
        addSchedule: { mutate: vi.fn() },
        updateSchedule: { mutate: vi.fn() },
        deleteSchedule: { mutate: vi.fn() },
        adminUpdateMedication: { mutate: vi.fn() },
        adminDeleteMedication: { mutate: vi.fn() },
        adminCreateMedication: { mutate: vi.fn() },
      },
    },
  };
});

const { trpcClient } = await import('@/providers/trpc');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAdminPillboxList', () => {
  const mockData = {
    items: [{ id: '1', medicationName: 'Doliprane' }],
    total: 1,
    page: 1,
    limit: 12,
  };

  it('fetches admin pillbox list with correct params', async () => {
    const handler = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () =>
        useAdminPillboxList({
          search: 'doli',
          isActive: true,
          page: 1,
          limit: 12,
        }),
      {
        trpcHandlers: {
          'pillbox.adminListAll': handler,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(handler).toHaveBeenCalledWith({
      search: 'doli',
      isActive: true,
      page: 1,
      limit: 12,
    });
    expect(result.current.data).toEqual(mockData);
  });

  it('does not run query when enabled is false', () => {
    const handler = vi.fn();

    const { result } = renderHook(
      () =>
        useAdminPillboxList({
          page: 1,
          limit: 12,
          enabled: false,
        }),
      {
        trpcHandlers: {
          'pillbox.adminListAll': handler,
        },
      },
    );

    expect(handler).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('returns error state on failure', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useAdminPillboxList({ page: 1, limit: 12 }), {
      trpcHandlers: {
        'pillbox.adminListAll': handler,
      },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Server error');
  });
});

describe('usePillboxDetail', () => {
  const mockDetail = {
    id: 'med_1',
    medicationName: 'Doliprane',
    schedules: [],
  };

  it('fetches medication detail by id', async () => {
    const handler = vi.fn().mockResolvedValue(mockDetail);

    const { result } = renderHook(() => usePillboxDetail('med_1'), {
      trpcHandlers: {
        'pillbox.detail': handler,
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(handler).toHaveBeenCalledWith({ id: 'med_1' });
    expect(result.current.data).toEqual(mockDetail);
  });

  it('does not run when id is empty', () => {
    const handler = vi.fn();

    const { result } = renderHook(() => usePillboxDetail(''), {
      trpcHandlers: {
        'pillbox.detail': handler,
      },
    });

    expect(handler).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('does not run when enabled is false', () => {
    const handler = vi.fn();

    const { result } = renderHook(() => usePillboxDetail('med_1', false), {
      trpcHandlers: {
        'pillbox.detail': handler,
      },
    });

    expect(handler).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});

describe('useAddSchedule', () => {
  it('calls mutate and shows success toast', async () => {
    const mutate = (trpcClient as any).pillbox.addSchedule.mutate;
    mutate.mockResolvedValueOnce({ id: 'sched_1' });

    const { result } = renderHook(() => useAddSchedule());

    result.current.mutate({
      patientMedicationId: 'med_1',
      intakeTime: '08:00',
      intakeMoment: 'MORNING',
      quantity: '1',
    });

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          patientMedicationId: 'med_1',
          intakeTime: '08:00',
        }),
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const mutate = (trpcClient as any).pillbox.addSchedule.mutate;
    mutate.mockRejectedValueOnce(new Error('Failed'));

    const { result } = renderHook(() => useAddSchedule());
    result.current.mutate({
      patientMedicationId: 'med_1',
      intakeTime: '08:00',
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed'));
    });
  });

  it('shows fallback error message for non-Error values', async () => {
    const mutate = (trpcClient as any).pillbox.addSchedule.mutate;
    mutate.mockRejectedValueOnce(null);

    const { result } = renderHook(() => useAddSchedule());
    result.current.mutate({ patientMedicationId: 'med_1', intakeTime: '08:00' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erreur inconnue'));
    });
  });
});

describe('useUpdateSchedule', () => {
  it('calls mutate and shows success toast', async () => {
    const mutate = (trpcClient as any).pillbox.updateSchedule.mutate;
    mutate.mockResolvedValueOnce({ id: 'sched_1' });

    const { result } = renderHook(() => useUpdateSchedule());

    result.current.mutate({ id: 'sched_1', intakeTime: '09:00' });

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'sched_1', intakeTime: '09:00' }),
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const mutate = (trpcClient as any).pillbox.updateSchedule.mutate;
    mutate.mockRejectedValueOnce(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateSchedule());
    result.current.mutate({ id: 'sched_1' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Update failed'));
    });
  });

  it('shows fallback error message for non-Error values', async () => {
    const mutate = (trpcClient as any).pillbox.updateSchedule.mutate;
    mutate.mockRejectedValueOnce(undefined);

    const { result } = renderHook(() => useUpdateSchedule());
    result.current.mutate({ id: 'sched_1' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erreur inconnue'));
    });
  });
});

describe('useDeleteSchedule', () => {
  it('calls mutate and shows success toast', async () => {
    const mutate = (trpcClient as any).pillbox.deleteSchedule.mutate;
    mutate.mockResolvedValueOnce({ id: 'sched_1' });

    const { result } = renderHook(() => useDeleteSchedule());

    result.current.mutate({ id: 'sched_1' });

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ id: 'sched_1' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const mutate = (trpcClient as any).pillbox.deleteSchedule.mutate;
    mutate.mockRejectedValueOnce(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteSchedule());
    result.current.mutate({ id: 'sched_1' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Delete failed'));
    });
  });

  it('shows fallback error message for non-Error values', async () => {
    const mutate = (trpcClient as any).pillbox.deleteSchedule.mutate;
    mutate.mockRejectedValueOnce(false);

    const { result } = renderHook(() => useDeleteSchedule());
    result.current.mutate({ id: 'sched_1' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erreur inconnue'));
    });
  });
});

describe('useAdminUpdateMedication', () => {
  it('calls mutate and shows success toast', async () => {
    const mutate = (trpcClient as any).pillbox.adminUpdateMedication.mutate;
    mutate.mockResolvedValueOnce({ id: 'med_1' });

    const { result } = renderHook(() => useAdminUpdateMedication());

    result.current.mutate({ id: 'med_1', dosageLabel: '500mg' });

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'med_1', dosageLabel: '500mg' }),
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const mutate = (trpcClient as any).pillbox.adminUpdateMedication.mutate;
    mutate.mockRejectedValueOnce(new Error('Update failed'));

    const { result } = renderHook(() => useAdminUpdateMedication());
    result.current.mutate({ id: 'med_1' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Update failed'));
    });
  });

  it('shows fallback error message for non-Error values', async () => {
    const mutate = (trpcClient as any).pillbox.adminUpdateMedication.mutate;
    mutate.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useAdminUpdateMedication());
    result.current.mutate({ id: 'med_1' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erreur inconnue'));
    });
  });
});

describe('useAdminDeleteMedication', () => {
  it('calls mutate and shows success toast', async () => {
    const mutate = (trpcClient as any).pillbox.adminDeleteMedication.mutate;
    mutate.mockResolvedValueOnce({ id: 'med_1' });

    const { result } = renderHook(() => useAdminDeleteMedication());

    result.current.mutate({ id: 'med_1' });

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ id: 'med_1' });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const mutate = (trpcClient as any).pillbox.adminDeleteMedication.mutate;
    mutate.mockRejectedValueOnce(new Error('Delete failed'));

    const { result } = renderHook(() => useAdminDeleteMedication());
    result.current.mutate({ id: 'med_1' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Delete failed'));
    });
  });

  it('shows fallback error message for non-Error values', async () => {
    const mutate = (trpcClient as any).pillbox.adminDeleteMedication.mutate;
    mutate.mockRejectedValueOnce(42);

    const { result } = renderHook(() => useAdminDeleteMedication());
    result.current.mutate({ id: 'med_1' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erreur inconnue'));
    });
  });
});

describe('useAdminCreateMedication', () => {
  const input = {
    patientId: 'patient_1',
    medicationName: 'Doliprane',
    source: 'api-medicaments-fr',
    startDate: '2025-01-01',
    schedules: [{ intakeTime: '08:00', intakeMoment: 'MORNING' as const, quantity: '1' }],
  };

  it('calls mutate and shows success toast', async () => {
    const mutate = (trpcClient as any).pillbox.adminCreateMedication.mutate;
    mutate.mockResolvedValueOnce({ id: 'med_1', schedules: [] });

    const { result } = renderHook(() => useAdminCreateMedication());

    result.current.mutate(input);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ patientId: 'patient_1', medicationName: 'Doliprane' }),
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows error toast on failure', async () => {
    const mutate = (trpcClient as any).pillbox.adminCreateMedication.mutate;
    mutate.mockRejectedValueOnce(new Error('Create failed'));

    const { result } = renderHook(() => useAdminCreateMedication());
    result.current.mutate(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Create failed'));
    });
  });

  it('shows fallback error message for non-Error values', async () => {
    const mutate = (trpcClient as any).pillbox.adminCreateMedication.mutate;
    mutate.mockRejectedValueOnce(123);

    const { result } = renderHook(() => useAdminCreateMedication());
    result.current.mutate(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Erreur inconnue'));
    });
  });
});
