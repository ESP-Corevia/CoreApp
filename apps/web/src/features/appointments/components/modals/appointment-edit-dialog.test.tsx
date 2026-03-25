/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { AppointmentEditDialog } from './appointment-edit-dialog';

vi.mock('@/queries', () => ({
  useUpdateAppointment: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

const baseAppointment = {
  id: 'appt-1',
  doctorId: 'doc-1',
  patientId: 'pat-1',
  date: '2099-06-15',
  time: '10:00',
  status: 'PENDING',
  reason: 'Checkup',
  createdAt: '2099-06-01T00:00:00Z',
  doctorName: 'Dr. Smith',
  patientName: 'John Doe',
};

describe('AppointmentEditDialog', () => {
  const onOpenChange = vi.fn();
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useUpdateAppointment).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = () =>
    render(
      <AppointmentEditDialog
        open
        onOpenChange={onOpenChange}
        appointment={baseAppointment}
      />,
    );

  it('renders dialog with pre-filled values', () => {
    const { getByRole, getByLabelText } = setup();

    expect(getByRole('dialog', { name: /Edit Appointment/i })).toBeInTheDocument();
    expect(getByLabelText(/Date/i)).toHaveValue('2099-06-15');
    expect(getByRole('combobox', { name: /Time/i })).toHaveTextContent('10:00');
  });

  it('shows patient and doctor info in description', () => {
    const { getByText } = setup();

    expect(getByText(/John Doe/)).toBeInTheDocument();
    expect(getByText(/Dr. Smith/)).toBeInTheDocument();
  });

  it('calls mutation with updated fields on submit', async () => {
    const { getByLabelText, getByRole } = setup();
    const user = userEvent.setup();

    const reasonField = getByLabelText(/Reason/i);
    await user.clear(reasonField);
    await user.type(reasonField, 'Updated reason');

    await user.click(getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'appt-1',
          reason: 'Updated reason',
        }),
        expect.any(Object),
      );
    });
  });

  it('closes dialog on successful mutation', async () => {
    const { getByLabelText, getByRole } = setup();
    const user = userEvent.setup();

    let onSuccessFn: () => void = () => {};
    mutate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      onSuccessFn = opts.onSuccess;
    });

    const reasonField = getByLabelText(/Reason/i);
    await user.clear(reasonField);
    await user.type(reasonField, 'New reason');

    await user.click(getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalled();
    });

    onSuccessFn();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables save button when form is not dirty', () => {
    const { getByRole } = setup();

    expect(getByRole('button', { name: /Save Changes/i })).toBeDisabled();
  });
});
