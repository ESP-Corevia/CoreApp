import { screen } from '@testing-library/react';

import { render } from '@/test/render';

import PillboxMedicationCard from './pillbox-medication-card';

const baseMedication = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  medicationName: 'Doliprane 500mg',
  medicationForm: 'comprimé',
  dosageLabel: '500mg',
  iconKey: 'tablet',
  isActive: true,
  startDate: '2025-01-01',
  endDate: null as string | null,
  patientName: null as string | null,
  patientEmail: null as string | null,
};

describe('PillboxMedicationCard', () => {
  it('renders medication name', () => {
    render(<PillboxMedicationCard medication={baseMedication} />);

    expect(screen.getByText('Doliprane 500mg')).toBeInTheDocument();
  });

  it('renders form and dosage', () => {
    render(<PillboxMedicationCard medication={baseMedication} />);

    expect(screen.getByText('comprimé — 500mg')).toBeInTheDocument();
  });

  it('renders active badge when isActive is true', () => {
    render(<PillboxMedicationCard medication={baseMedication} />);

    expect(screen.getByText(/actif/i)).toBeInTheDocument();
  });

  it('renders inactive badge when isActive is false', () => {
    const med = { ...baseMedication, isActive: false };
    render(<PillboxMedicationCard medication={med} />);

    expect(screen.getByText(/inactif/i)).toBeInTheDocument();
  });

  it('renders start date', () => {
    render(<PillboxMedicationCard medication={baseMedication} />);

    expect(screen.getByText(/1 janv. 2025/i)).toBeInTheDocument();
  });

  it('renders end date when provided', () => {
    const med = { ...baseMedication, endDate: '2025-06-30' };
    render(<PillboxMedicationCard medication={med} />);

    expect(screen.getByText(/30 juin 2025/i)).toBeInTheDocument();
  });

  it('renders patient info for admin view', () => {
    const med = {
      ...baseMedication,
      patientName: 'Jean Dupont',
      patientEmail: 'jean@test.com',
    };
    render(<PillboxMedicationCard medication={med} />);

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('jean@test.com')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // initials
  });

  it('does not render patient info when patientName is null', () => {
    render(<PillboxMedicationCard medication={baseMedication} />);

    expect(screen.queryByText('jean@test.com')).not.toBeInTheDocument();
  });

  it('links to medication detail page', () => {
    render(<PillboxMedicationCard medication={baseMedication} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/pillbox/${baseMedication.id}`);
  });

  it('hides form/dosage when both are null', () => {
    const med = { ...baseMedication, medicationForm: null as any, dosageLabel: null as any };
    render(<PillboxMedicationCard medication={med} />);

    expect(screen.queryByText('comprimé')).not.toBeInTheDocument();
  });
});
