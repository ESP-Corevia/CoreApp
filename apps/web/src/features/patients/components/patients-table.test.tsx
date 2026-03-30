import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import type { Patient } from './patients-table';
import PatientsTable from './patients-table';

vi.mock('@/queries', () => ({
  useUpdatePatient: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeletePatient: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockPatients: Patient[] = [
  {
    userId: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    emailVerified: true,
    image: null,
    role: 'patient',
    banned: false,
    createdAt: '2099-01-01T00:00:00Z',
    updatedAt: null,
    patientId: 'pat-1',
    dateOfBirth: '1990-05-20',
    gender: 'MALE',
    phone: '+33612345678',
    patientAddress: '10 Rue Test',
    bloodType: 'A+',
    allergies: 'Pollen',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '+33698765432',
  },
  {
    userId: 'user-2',
    name: 'Alice Martin',
    email: 'alice@example.com',
    emailVerified: false,
    image: null,
    role: 'patient',
    banned: false,
    createdAt: '2099-02-01T00:00:00Z',
    updatedAt: null,
    patientId: 'pat-2',
    dateOfBirth: '1985-11-15',
    gender: 'FEMALE',
    phone: null,
    patientAddress: null,
    bloodType: null,
    allergies: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
  },
];

describe('PatientsTable', () => {
  it('renders the title', () => {
    const { getByText } = render(
      <PatientsTable data={[]} pageCount={0} isLoading={false} title="Patients Management" />,
    );

    expect(getByText('Patients Management')).toBeInTheDocument();
  });

  it('renders patient rows with name, email, gender, and date of birth', () => {
    const { getByText } = render(
      <PatientsTable data={mockPatients} pageCount={1} isLoading={false} title="Patients" />,
    );

    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('john@example.com')).toBeInTheDocument();
    expect(getByText('male')).toBeInTheDocument();
    expect(getByText('1990-05-20')).toBeInTheDocument();
  });

  it('renders blood type badge when available', () => {
    const { getByText } = render(
      <PatientsTable data={mockPatients} pageCount={1} isLoading={false} title="Patients" />,
    );

    expect(getByText('A+')).toBeInTheDocument();
  });

  it('renders fallback for null phone', () => {
    const { getAllByText } = render(
      <PatientsTable data={mockPatients} pageCount={1} isLoading={false} title="Patients" />,
    );

    const dashes = getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});
