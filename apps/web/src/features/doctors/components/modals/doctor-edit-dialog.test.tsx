/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { DoctorEditDialog } from './doctor-edit-dialog';

vi.mock('@/queries', () => ({
  useUpdateDoctor: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

const baseDoctor = {
  id: 'doc-1',
  userId: 'user-1',
  specialty: 'Cardiology',
  address: '10 Rue de Rivoli',
  city: 'Paris',
  name: 'Dr. Smith',
  email: 'smith@example.com',
  image: null,
};

describe('DoctorEditDialog', () => {
  const onOpenChange = vi.fn();
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useUpdateDoctor).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = () =>
    render(<DoctorEditDialog open onOpenChange={onOpenChange} doctor={baseDoctor} />);

  it('renders dialog with pre-filled values', () => {
    const { getByRole, getByDisplayValue } = setup();

    expect(getByRole('dialog', { name: /Edit Doctor Profile/i })).toBeInTheDocument();
    expect(getByDisplayValue('Cardiology')).toBeInTheDocument();
    expect(getByDisplayValue('10 Rue de Rivoli')).toBeInTheDocument();
    expect(getByDisplayValue('Paris')).toBeInTheDocument();
  });

  it('shows doctor name in description', () => {
    const { getByText } = setup();

    expect(getByText(/Dr. Smith/)).toBeInTheDocument();
  });

  it('calls mutation with updated fields on submit', async () => {
    const { getByRole } = setup();
    const user = userEvent.setup();

    const specialtyField = getByRole('textbox', { name: /Specialty/i });
    await user.clear(specialtyField);
    await user.type(specialtyField, 'Oncology');

    await user.click(getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          specialty: 'Oncology',
          address: '10 Rue de Rivoli',
          city: 'Paris',
        }),
        expect.any(Object),
      );
    });
  });

  it('closes dialog on successful mutation', async () => {
    const { getByRole } = setup();
    const user = userEvent.setup();

    let onSuccessFn: () => void = () => {};
    mutate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      onSuccessFn = opts.onSuccess;
    });

    const cityField = getByRole('textbox', { name: /City/i });
    await user.clear(cityField);
    await user.type(cityField, 'Lyon');

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
