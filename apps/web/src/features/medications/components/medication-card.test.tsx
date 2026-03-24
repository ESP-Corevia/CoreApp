import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { render } from '@/test/render';

import MedicationCard, { type MedicationData } from './medication-card';

const baseMedication: MedicationData = {
  externalId: '60234100',
  cis: '60234100',
  cip: '3400930234567',
  name: 'DOLIPRANE 500 mg, comprimé',
  shortLabel: 'DOLIPRANE 500 mg, comprimé',
  form: 'comprimé',
  route: 'orale',
  activeSubstances: ['PARACÉTAMOL'],
  laboratory: 'SANOFI',
  reimbursementRate: '65%',
  price: '2.18',
  status: 'Commercialisée',
  marketingStatus: 'Commercialisée',
  source: 'api-medicaments-fr',
  normalizedForm: 'tablet',
  iconKey: 'tablet',
};

describe('MedicationCard', () => {
  it('renders medication name', () => {
    render(<MedicationCard medication={baseMedication} onAdd={vi.fn()} />);

    expect(screen.getByText('DOLIPRANE 500 mg, comprimé')).toBeInTheDocument();
  });

  it('renders active substances as badges', () => {
    render(<MedicationCard medication={baseMedication} onAdd={vi.fn()} />);

    expect(screen.getByText('PARACÉTAMOL')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<MedicationCard medication={baseMedication} onAdd={vi.fn()} />);

    expect(screen.getByText('Commercialisée')).toBeInTheDocument();
  });

  it('renders form and route', () => {
    render(<MedicationCard medication={baseMedication} onAdd={vi.fn()} />);

    expect(screen.getByText('comprimé — orale')).toBeInTheDocument();
  });

  it('renders laboratory', () => {
    render(<MedicationCard medication={baseMedication} onAdd={vi.fn()} />);

    expect(screen.getByText('SANOFI')).toBeInTheDocument();
  });

  it('renders price', () => {
    render(<MedicationCard medication={baseMedication} onAdd={vi.fn()} />);

    expect(screen.getByText(/2\.18/)).toBeInTheDocument();
  });

  it('renders reimbursement rate', () => {
    render(<MedicationCard medication={baseMedication} onAdd={vi.fn()} />);

    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('calls onAdd when add button is clicked', async () => {
    const onAdd = vi.fn();
    render(<MedicationCard medication={baseMedication} onAdd={onAdd} />);

    await userEvent.setup().click(screen.getByRole('button', { name: /ajouter/i }));

    expect(onAdd).toHaveBeenCalledWith(baseMedication);
  });

  it('hides status badge when status is null', () => {
    const med = { ...baseMedication, status: null };
    render(<MedicationCard medication={med} onAdd={vi.fn()} />);

    expect(screen.queryByText('Commercialisée')).not.toBeInTheDocument();
  });

  it('hides laboratory when null', () => {
    const med = { ...baseMedication, laboratory: null };
    render(<MedicationCard medication={med} onAdd={vi.fn()} />);

    expect(screen.queryByText('SANOFI')).not.toBeInTheDocument();
  });

  it('hides active substances when empty', () => {
    const med = { ...baseMedication, activeSubstances: [] };
    render(<MedicationCard medication={med} onAdd={vi.fn()} />);

    expect(screen.queryByText('PARACÉTAMOL')).not.toBeInTheDocument();
  });
});
