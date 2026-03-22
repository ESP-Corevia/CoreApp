import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { render } from '@/test/render';

import AddToPillboxDialog from './add-to-pillbox-dialog';

import type { MedicationData } from './medication-card';

vi.mock('@/providers/trpc', async importOriginal => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import('@/providers/trpc')>();
  return {
    ...original,
    trpcClient: {
      pillbox: {
        adminCreateMedication: { mutate: vi.fn() },
      },
    },
  };
});

const { trpcClient } = await import('@/providers/trpc');

const fakeMedication: MedicationData = {
  externalId: 'ext_1',
  cis: '60234100',
  cip: '3400930234567',
  name: 'DOLIPRANE 500mg',
  shortLabel: 'DOLIPRANE 500mg',
  form: 'comprimé',
  route: 'orale',
  activeSubstances: ['PARACÉTAMOL'],
  laboratory: 'SANOFI',
  reimbursementRate: '65%',
  price: '2.18',
  status: 'Autorisé',
  marketingStatus: 'Commercialisée',
  source: 'api-medicaments-fr',
  normalizedForm: 'tablet',
  iconKey: 'tablet',
};

function getSubmitButton() {
  const buttons = screen.getAllByRole('button');
  return buttons.find(btn => btn.getAttribute('type') === 'submit')!;
}

function getScheduleAddButton() {
  const buttons = screen.getAllByRole('button');
  return buttons.find(
    btn => btn.textContent.includes('Ajouter') && btn.getAttribute('type') === 'button'
  )!;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AddToPillboxDialog', () => {
  it('renders the dialog with medication info', () => {
    render(<AddToPillboxDialog open onOpenChange={vi.fn()} medication={fakeMedication} />);

    expect(screen.getByText('DOLIPRANE 500mg')).toBeInTheDocument();
    expect(screen.getByText(/comprimé/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddToPillboxDialog open={false} onOpenChange={vi.fn()} medication={fakeMedication} />);

    expect(screen.queryByText('DOLIPRANE 500mg')).not.toBeInTheDocument();
  });

  it('shows inline error when patientId is empty on submit', async () => {
    const user = userEvent.setup();

    render(<AddToPillboxDialog open onOpenChange={vi.fn()} medication={fakeMedication} />);

    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/l'identifiant du patient est requis/i)).toBeInTheDocument();
    });

    const mutate = (trpcClient as any).pillbox.adminCreateMedication.mutate;
    expect(mutate).not.toHaveBeenCalled();
  });

  it('calls adminCreateMedication with correct payload on submit', async () => {
    const user = userEvent.setup();
    const mutate = (trpcClient as any).pillbox.adminCreateMedication.mutate;
    mutate.mockResolvedValueOnce({ id: 'med_1', schedules: [] });
    const onOpenChange = vi.fn();

    render(<AddToPillboxDialog open onOpenChange={onOpenChange} medication={fakeMedication} />);

    await user.type(screen.getByPlaceholderText(/uuid du patient/i), 'patient-uuid-123');
    await user.type(screen.getByPlaceholderText('ex: 500mg'), '500mg');

    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-uuid-123',
          medicationName: 'DOLIPRANE 500mg',
          medicationForm: 'comprimé',
          cis: '60234100',
          dosageLabel: '500mg',
          source: 'api-medicaments-fr',
          schedules: expect.arrayContaining([
            expect.objectContaining({ intakeTime: '08:00', intakeMoment: 'MORNING' }),
          ]),
        })
      );
    });
  });

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<AddToPillboxDialog open onOpenChange={onOpenChange} medication={fakeMedication} />);

    await user.click(screen.getByRole('button', { name: /annuler/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders default schedule with morning time', () => {
    render(<AddToPillboxDialog open onOpenChange={vi.fn()} medication={fakeMedication} />);

    expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
  });

  it('adds a new schedule when add button is clicked', async () => {
    const user = userEvent.setup();

    render(<AddToPillboxDialog open onOpenChange={vi.fn()} medication={fakeMedication} />);

    await user.click(getScheduleAddButton());

    const timeInputs = screen.getAllByDisplayValue('08:00');
    expect(timeInputs).toHaveLength(2);
  });
});
