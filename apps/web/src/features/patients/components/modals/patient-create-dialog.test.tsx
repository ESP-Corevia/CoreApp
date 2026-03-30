/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { PatientCreateDialog } from './patient-create-dialog';

vi.mock('@/queries', () => ({
  useCreatePatient: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

describe('PatientCreateDialog', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useCreatePatient).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = async () => {
    const ui = render(<PatientCreateDialog />);
    const user = userEvent.setup();
    await user.click(ui.getByRole('button', { name: /Create Patient/i }));
    return { ...ui, user };
  };

  async function fill(user: ReturnType<typeof userEvent.setup>, el: HTMLElement, value: string) {
    await user.click(el);
    await user.paste(value);
  }

  it('renders dialog correctly when opened', async () => {
    const { getByRole, getByLabelText } = await setup();

    expect(getByRole('dialog', { name: /Create Patient Profile/i })).toBeInTheDocument();
    expect(getByRole('textbox', { name: /User UUID/i })).toBeInTheDocument();
    expect(getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(getByRole('combobox', { name: /Gender/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const { getByRole, getByLabelText, user } = await setup();

    await fill(
      user,
      getByRole('textbox', { name: /User UUID/i }),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );
    await fill(user, getByLabelText(/Date of Birth/i), '1990-05-20');

    await user.click(getByRole('button', { name: /Create Patient Profile/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          dateOfBirth: '1990-05-20',
          gender: 'MALE',
        }),
        expect.any(Object),
      );
    });
  });

  it('closes dialog on successful mutation', async () => {
    mutate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });

    const { getByRole, getByLabelText, user, queryByRole } = await setup();

    await fill(
      user,
      getByRole('textbox', { name: /User UUID/i }),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );
    await fill(user, getByLabelText(/Date of Birth/i), '1990-05-20');

    await user.click(getByRole('button', { name: /Create Patient Profile/i }));

    await waitFor(() => {
      expect(queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows cancel button that closes dialog', async () => {
    const { getByRole, user, queryByRole } = await setup();

    await user.click(getByRole('button', { name: /Cancel/i }));

    await waitFor(() => {
      expect(queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
