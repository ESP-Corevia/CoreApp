/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { PatientEditDialog } from './patient-edit-dialog';

vi.mock('@/queries', () => ({
  useUpdatePatient: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
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
  phone: '+33612345678',
  patientAddress: '10 Rue Test',
  bloodType: 'A+',
  allergies: 'Pollen',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '+33698765432',
};

describe('PatientEditDialog', () => {
  const onOpenChange = vi.fn();
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useUpdatePatient).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = () =>
    render(<PatientEditDialog open onOpenChange={onOpenChange} patient={basePatient} />);

  it('renders dialog with pre-filled values', () => {
    const { getByRole, getByDisplayValue } = setup();

    expect(getByRole('dialog', { name: /Edit Patient Profile/i })).toBeInTheDocument();
    expect(getByDisplayValue('1990-05-20')).toBeInTheDocument();
    expect(getByDisplayValue('+33612345678')).toBeInTheDocument();
    expect(getByDisplayValue('10 Rue Test')).toBeInTheDocument();
    expect(getByDisplayValue('Pollen')).toBeInTheDocument();
  });

  it('shows patient name in description', () => {
    const { getByText } = setup();

    expect(getByText(/John Doe/)).toBeInTheDocument();
  });

  it('calls mutation with updated fields on submit', async () => {
    const { getByRole, getByLabelText } = setup();
    const user = userEvent.setup();

    const phoneField = getByLabelText(/^Phone$/i);
    await user.clear(phoneField);
    await user.paste('+33600000000');

    await user.click(getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          phone: '+33600000000',
        }),
        expect.any(Object),
      );
    });
  });

  it('closes dialog on successful mutation', async () => {
    const { getByRole, getByLabelText } = setup();
    const user = userEvent.setup();

    let onSuccessFn: () => void = () => {};
    mutate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      onSuccessFn = opts.onSuccess;
    });

    const allergiesField = getByLabelText(/Allergies/i);
    await user.clear(allergiesField);
    await user.paste('Dust');

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
