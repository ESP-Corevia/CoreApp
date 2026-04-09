import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';
import type { Doctor } from './doctors-table';
import DoctorsTable from './doctors-table';

const mockDoctors: Doctor[] = [
  {
    id: 'doc-1',
    userId: 'user-1',
    specialty: 'Cardiology',
    address: '10 Rue de Rivoli',
    city: 'Paris',
    name: 'Dr. Smith',
    email: 'smith@example.com',
    image: null,
    verified: true,
  },
  {
    id: 'doc-2',
    userId: 'user-2',
    specialty: 'Dermatology',
    address: '5 Avenue Foch',
    city: 'Lyon',
    name: null,
    email: null,
    image: null,
    verified: false,
  },
];

describe('DoctorsTable', () => {
  it('renders the title', () => {
    const { getByText } = render(
      <DoctorsTable data={[]} pageCount={0} isLoading={false} title="Doctors Management" />,
    );

    expect(getByText('Doctors Management')).toBeInTheDocument();
  });

  it('renders doctor rows with name, email, specialty, and city', () => {
    const { getByText } = render(
      <DoctorsTable data={mockDoctors} pageCount={1} isLoading={false} title="Doctors" />,
    );

    expect(getByText('Dr. Smith')).toBeInTheDocument();
    expect(getByText('smith@example.com')).toBeInTheDocument();
    expect(getByText('Cardiology')).toBeInTheDocument();
    expect(getByText('Paris')).toBeInTheDocument();
  });

  it('renders fallback for null name and email', () => {
    const { getAllByText } = render(
      <DoctorsTable data={mockDoctors} pageCount={1} isLoading={false} title="Doctors" />,
    );

    const dashes = getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders without error when onSearchChange is provided', () => {
    const onSearchChange = vi.fn();

    const { getByText } = render(
      <DoctorsTable
        data={[]}
        pageCount={0}
        isLoading={false}
        title="Doctors"
        search=""
        onSearchChange={onSearchChange}
      />,
    );

    expect(getByText('Doctors')).toBeInTheDocument();
  });
});
