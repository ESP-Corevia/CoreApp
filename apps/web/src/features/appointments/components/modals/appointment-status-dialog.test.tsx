import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { AppointmentStatusDialog } from './appointment-status-dialog';

vi.mock('@/queries', () => ({
  useUpdateAppointmentStatus: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

const baseAppointment = {
  id: 'appt-1',
  doctorId: 'doc-1',
  patientId: 'pat-1',
  date: '2099-06-15',
  time: '10:00',
  status: 'PENDING',
  reason: null,
  createdAt: '2099-06-01T00:00:00Z',
  doctorName: 'Dr. Smith',
  patientName: 'John Doe',
};

describe('AppointmentStatusDialog', () => {
  const onOpenChange = vi.fn();
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useUpdateAppointmentStatus).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = (targetStatus: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' = 'CONFIRMED') =>
    render(
      <AppointmentStatusDialog
        open
        onOpenChange={onOpenChange}
        appointment={baseAppointment}
        targetStatus={targetStatus}
      />
    );

  it('renders dialog with correct title for confirm action', () => {
    const { getByRole } = setup('CONFIRMED');

    expect(getByRole('alertdialog', { name: /Confirm Appointment/i })).toBeInTheDocument();
    expect(getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
  });

  it('renders dialog with correct title for cancel action', () => {
    const { getByRole } = setup('CANCELLED');

    expect(getByRole('alertdialog', { name: /Cancel Appointment/i })).toBeInTheDocument();
  });

  it('renders dialog with correct title for complete action', () => {
    const { getByRole } = setup('COMPLETED');

    expect(getByRole('alertdialog', { name: /Complete Appointment/i })).toBeInTheDocument();
  });

  it('shows patient and doctor info in description', () => {
    const { getByText } = setup('CONFIRMED');

    expect(getByText(/John Doe/)).toBeInTheDocument();
    expect(getByText(/Dr. Smith/)).toBeInTheDocument();
  });

  it('calls mutation with correct params on confirm', async () => {
    const { getByRole } = setup('CONFIRMED');
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /^Confirm$/i }));

    expect(mutate).toHaveBeenCalledWith({ id: 'appt-1', status: 'CONFIRMED' }, expect.any(Object));
  });

  it('closes dialog on successful mutation', async () => {
    const { getByRole } = setup('CONFIRMED');
    const user = userEvent.setup();

    let onSuccessFn: () => void = () => {};
    mutate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      onSuccessFn = opts.onSuccess;
    });

    await user.click(getByRole('button', { name: /^Confirm$/i }));
    onSuccessFn();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading state while pending', () => {
    vi.mocked(queries.useUpdateAppointmentStatus).mockReturnValue({
      mutate,
      isPending: true,
    } as any);

    const { getByRole } = setup('CONFIRMED');

    expect(getByRole('button', { name: /Processing/i })).toBeDisabled();
  });
});
