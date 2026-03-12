import { describe, it, expect, vi } from 'vitest';

import { render } from '@/test/render';

import AppointmentsTable from './appointments-table';

import type { Appointment } from './appointments-table';

vi.mock('@/queries', () => ({
  useUpdateAppointmentStatus: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

const mockAppointments: Appointment[] = [
  {
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
  },
  {
    id: 'appt-2',
    doctorId: 'doc-2',
    patientId: 'pat-2',
    date: '2099-07-20',
    time: '14:00',
    status: 'CONFIRMED',
    reason: null,
    createdAt: '2099-07-01T00:00:00Z',
    doctorName: 'Dr. Jones',
    patientName: null,
  },
];

describe('AppointmentsTable', () => {
  it('renders the title', () => {
    const { getByText } = render(
      <AppointmentsTable
        data={[]}
        pageCount={0}
        isLoading={false}
        title="Appointments Management"
      />
    );

    expect(getByText('Appointments Management')).toBeInTheDocument();
  });

  it('renders appointment rows with patient, doctor, and status', () => {
    const { getByText } = render(
      <AppointmentsTable
        data={mockAppointments}
        pageCount={1}
        isLoading={false}
        title="Appointments"
      />
    );

    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('Dr. Smith')).toBeInTheDocument();
    expect(getByText('Pending')).toBeInTheDocument();
    expect(getByText('Dr. Jones')).toBeInTheDocument();
    expect(getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders fallback for null names', () => {
    const { getAllByText } = render(
      <AppointmentsTable
        data={mockAppointments}
        pageCount={1}
        isLoading={false}
        title="Appointments"
      />
    );

    const dashes = getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders time column', () => {
    const { getByText } = render(
      <AppointmentsTable
        data={mockAppointments}
        pageCount={1}
        isLoading={false}
        title="Appointments"
      />
    );

    expect(getByText('10:00')).toBeInTheDocument();
    expect(getByText('14:00')).toBeInTheDocument();
  });
});
