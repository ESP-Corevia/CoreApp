/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { PatientActionsMenu } from './patient-actions-menu';
import type { Patient } from './patients-table';

vi.mock('@/queries', () => ({
  useUpdatePatient: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeletePatient: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockPatient: Patient = {
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
  phone: null,
  patientAddress: null,
  bloodType: null,
  allergies: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
};

describe('PatientActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dropdown trigger', () => {
    const { getByRole } = render(<PatientActionsMenu patient={mockPatient} />);
    expect(getByRole('button', { name: /open patient menu/i })).toBeInTheDocument();
  });

  it('opens menu with Copy ID, Edit, and Delete actions', async () => {
    const { getByRole } = render(<PatientActionsMenu patient={mockPatient} />);
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open patient menu/i }));

    expect(getByRole('menuitem', { name: /Copy ID/i })).toBeInTheDocument();
    expect(getByRole('menuitem', { name: /Edit Profile/i })).toBeInTheDocument();
    expect(getByRole('menuitem', { name: /Delete Profile/i })).toBeInTheDocument();
  });

  it('copies user ID to clipboard and shows toast', async () => {
    const { toast } = await import('sonner');
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    const { getByRole } = render(<PatientActionsMenu patient={mockPatient} />);
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open patient menu/i }));
    await user.click(getByRole('menuitem', { name: /Copy ID/i }));

    expect(writeText).toHaveBeenCalledWith('user-1');
    expect(toast.success).toHaveBeenCalled();
  });

  it('opens edit dialog when clicking Edit Profile', async () => {
    const { getByRole } = render(<PatientActionsMenu patient={mockPatient} />);
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open patient menu/i }));
    await user.click(getByRole('menuitem', { name: /Edit Profile/i }));

    expect(getByRole('dialog', { name: /Edit Patient Profile/i })).toBeInTheDocument();
  });

  it('opens delete dialog when clicking Delete Profile', async () => {
    const { getByRole } = render(<PatientActionsMenu patient={mockPatient} />);
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /open patient menu/i }));
    await user.click(getByRole('menuitem', { name: /Delete Profile/i }));

    expect(getByRole('alertdialog', { name: /Delete Patient Profile/i })).toBeInTheDocument();
  });
});
