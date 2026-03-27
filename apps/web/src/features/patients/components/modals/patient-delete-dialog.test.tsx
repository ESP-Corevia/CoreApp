/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { PatientDeleteDialog } from './patient-delete-dialog';

vi.mock('@/queries', () => ({
  useDeletePatient: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

const basePatient = {
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

describe('PatientDeleteDialog', () => {
  const onOpenChange = vi.fn();
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useDeletePatient).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = () =>
    render(<PatientDeleteDialog open onOpenChange={onOpenChange} patient={basePatient} />);

  it('renders dialog with patient name', () => {
    const { getByRole, getByText } = setup();

    expect(getByRole('alertdialog', { name: /Delete Patient Profile/i })).toBeInTheDocument();
    expect(getByText(/John Doe/)).toBeInTheDocument();
  });

  it('calls mutation with userId on confirm', async () => {
    const { getByRole } = setup();
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /^Delete$/i }));

    expect(mutate).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('closes dialog on successful mutation', async () => {
    mutate.mockImplementation((_userId: string, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });

    const { getByRole } = setup();
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: /^Delete$/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows cancel button', () => {
    const { getByRole } = setup();

    expect(getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('shows loading state while pending', () => {
    vi.mocked(queries.useDeletePatient).mockReturnValue({
      mutate,
      isPending: true,
    } as any);

    const { getByRole } = setup();

    expect(getByRole('button', { name: /Deleting/i })).toBeDisabled();
  });
});
