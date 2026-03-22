import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, it, expect, vi } from 'vitest';

import { render } from '@/test/render';

import ScheduleEditor from './schedule-editor';

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
      pillbox: {
        addSchedule: { mutate: vi.fn() },
        updateSchedule: { mutate: vi.fn() },
        deleteSchedule: { mutate: vi.fn() },
      },
    },
  };
});

const { trpcClient } = await import('@/providers/trpc');

const fakeSchedules = [
  {
    id: 'sched_1',
    intakeTime: '08:00',
    intakeMoment: 'MORNING',
    quantity: '1',
    unit: 'comprimé',
    notes: null,
  },
  {
    id: 'sched_2',
    intakeTime: '20:00',
    intakeMoment: 'EVENING',
    quantity: '2',
    unit: 'ml',
    notes: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ScheduleEditor', () => {
  it('renders schedule count and items', () => {
    render(<ScheduleEditor medicationId="med_1" schedules={fakeSchedules} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
    expect(screen.getByText('MORNING')).toBeInTheDocument();
    expect(screen.getByText('EVENING')).toBeInTheDocument();
    expect(screen.getByText(/1 comprimé/)).toBeInTheDocument();
    expect(screen.getByText(/2 ml/)).toBeInTheDocument();
  });

  it('shows empty state when no schedules', () => {
    render(<ScheduleEditor medicationId="med_1" schedules={[]} />);

    expect(screen.getByText(/aucun rappel configuré/i)).toBeInTheDocument();
    expect(screen.getByText(/configurer un rappel/i)).toBeInTheDocument();
  });

  it('opens add form when clicking add button', async () => {
    const user = userEvent.setup();

    render(<ScheduleEditor medicationId="med_1" schedules={fakeSchedules} />);

    await user.click(screen.getByRole('button', { name: /ajouter/i }));

    expect(screen.getByText(/nouveau rappel/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
  });

  it('calls addSchedule mutation on save', async () => {
    const user = userEvent.setup();
    const mutate = (trpcClient as any).pillbox.addSchedule.mutate;
    mutate.mockResolvedValueOnce({ id: 'sched_new' });

    render(<ScheduleEditor medicationId="med_1" schedules={[]} />);

    // Open add form via empty state button
    await user.click(screen.getByText(/configurer un rappel/i));

    // Save with defaults
    const saveButtons = screen.getAllByRole('button', { name: /enregistrer/i });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          patientMedicationId: 'med_1',
          intakeTime: '08:00',
          intakeMoment: 'MORNING',
        })
      );
    });
  });

  it('closes add form when clicking cancel', async () => {
    const user = userEvent.setup();

    render(<ScheduleEditor medicationId="med_1" schedules={fakeSchedules} />);

    await user.click(screen.getByRole('button', { name: /ajouter/i }));
    expect(screen.getByText(/nouveau rappel/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /annuler/i }));
    expect(screen.queryByText(/nouveau rappel/i)).not.toBeInTheDocument();
  });

  it('shows success toast after adding schedule', async () => {
    const user = userEvent.setup();
    const mutate = (trpcClient as any).pillbox.addSchedule.mutate;
    mutate.mockResolvedValueOnce({ id: 'sched_new' });

    render(<ScheduleEditor medicationId="med_1" schedules={[]} />);

    await user.click(screen.getByText(/configurer un rappel/i));
    const saveButtons = screen.getAllByRole('button', { name: /enregistrer/i });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
