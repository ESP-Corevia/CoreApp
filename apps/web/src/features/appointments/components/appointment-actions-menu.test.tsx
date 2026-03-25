import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { AppointmentActionsMenu } from './appointment-actions-menu';

vi.mock('@/queries', () => ({
  useUpdateAppointmentStatus: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateAppointment: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteAppointment: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

const makeAppointment = (status: string) => ({
  id: 'appt-1',
  doctorId: 'doc-1',
  patientId: 'pat-1',
  date: '2099-06-15',
  time: '10:00',
  status,
  reason: null,
  createdAt: '2099-06-01T00:00:00Z',
  doctorName: 'Dr. Smith',
  patientName: 'John Doe',
});

describe('AppointmentActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders menu button for COMPLETED appointment with edit and delete', async () => {
    const { getByRole, queryByText } = render(
      <AppointmentActionsMenu appointment={makeAppointment('COMPLETED')} />,
    );
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open appointment menu/i }));

    expect(queryByText('Edit')).toBeInTheDocument();
    expect(queryByText('Delete')).toBeInTheDocument();
    expect(queryByText('Confirm')).not.toBeInTheDocument();
    expect(queryByText('Complete')).not.toBeInTheDocument();
  });

  it('renders menu button for CANCELLED appointment with edit and delete', async () => {
    const { getByRole, queryByText } = render(
      <AppointmentActionsMenu appointment={makeAppointment('CANCELLED')} />,
    );
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open appointment menu/i }));

    expect(queryByText('Edit')).toBeInTheDocument();
    expect(queryByText('Delete')).toBeInTheDocument();
    expect(queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('shows Edit, Confirm, Cancel, and Delete actions for PENDING appointment', async () => {
    const { getByRole, queryByText } = render(
      <AppointmentActionsMenu appointment={makeAppointment('PENDING')} />,
    );
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open appointment menu/i }));

    expect(queryByText('Edit')).toBeInTheDocument();
    expect(queryByText('Confirm')).toBeInTheDocument();
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Delete')).toBeInTheDocument();
    expect(queryByText('Complete')).not.toBeInTheDocument();
  });

  it('shows Edit, Complete, Cancel, and Delete actions for CONFIRMED appointment', async () => {
    const { getByRole, queryByText } = render(
      <AppointmentActionsMenu appointment={makeAppointment('CONFIRMED')} />,
    );
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open appointment menu/i }));

    expect(queryByText('Edit')).toBeInTheDocument();
    expect(queryByText('Complete')).toBeInTheDocument();
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Delete')).toBeInTheDocument();
    expect(queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('opens status dialog when clicking an action', async () => {
    const { getByRole, queryByText } = render(
      <AppointmentActionsMenu appointment={makeAppointment('PENDING')} />,
    );
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open appointment menu/i }));
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    await user.click(queryByText('Confirm')!);

    expect(getByRole('alertdialog')).toBeInTheDocument();
  });
});
