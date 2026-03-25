/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { AppointmentDeleteDialog } from './appointment-delete-dialog';

vi.mock('@/queries', () => ({
  useDeleteAppointment: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
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

describe('AppointmentDeleteDialog', () => {
  const onOpenChange = vi.fn();
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useDeleteAppointment).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = () =>
    render(
      <AppointmentDeleteDialog
        open
        onOpenChange={onOpenChange}
        appointment={baseAppointment}
      />,
    );

  it('renders dialog with appointment details', () => {
    const { getByRole, getByText } = setup();

    expect(getByRole('alertdialog', { name: /Delete Appointment/i })).toBeInTheDocument();
    expect(getByText(/John Doe/)).toBeInTheDocument();
    expect(getByText(/Dr. Smith/)).toBeInTheDocument();
    expect(getByText(/2099-06-15/)).toBeInTheDocument();
  });

  it('calls mutation with appointment id on delete', async () => {
    const { getByRole } = setup();
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /Delete/i }));

    expect(mutate).toHaveBeenCalledWith('appt-1', expect.any(Object));
  });

  it('closes dialog on successful mutation', async () => {
    const { getByRole } = setup();
    const user = userEvent.setup();

    let onSuccessFn: () => void = () => {};
    mutate.mockImplementation((_id: unknown, opts: { onSuccess: () => void }) => {
      onSuccessFn = opts.onSuccess;
    });

    await user.click(getByRole('button', { name: /Delete/i }));
    onSuccessFn();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading state while pending', () => {
    vi.mocked(queries.useDeleteAppointment).mockReturnValue({
      mutate,
      isPending: true,
    } as any);

    const { getByRole } = setup();

    expect(getByRole('button', { name: /Deleting/i })).toBeDisabled();
  });

  it('has a cancel button', () => {
    const { getByRole } = setup();

    expect(getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });
});
