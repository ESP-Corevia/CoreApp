/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { DoctorCreateDialog } from './doctor-create-dialog';

vi.mock('@/queries', () => ({
  useCreateDoctor: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

describe('DoctorCreateDialog', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useCreateDoctor).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = async () => {
    const ui = render(<DoctorCreateDialog />);
    const user = userEvent.setup();

    await user.click(ui.getByRole('button', { name: /Create Doctor/i }));

    return { ...ui, user };
  };

  it('renders dialog correctly when opened', async () => {
    const { getByRole } = await setup();

    expect(getByRole('dialog', { name: /Create Doctor Profile/i })).toBeInTheDocument();
    expect(getByRole('textbox', { name: /User UUID/i })).toBeInTheDocument();
    expect(getByRole('textbox', { name: /Specialty/i })).toBeInTheDocument();
    expect(getByRole('textbox', { name: /Address/i })).toBeInTheDocument();
    expect(getByRole('textbox', { name: /City/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const { getByRole, user } = await setup();

    await user.type(
      getByRole('textbox', { name: /User UUID/i }),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );
    await user.type(getByRole('textbox', { name: /Specialty/i }), 'Cardiology');
    await user.type(getByRole('textbox', { name: /Address/i }), '10 Rue de la Paix');
    await user.type(getByRole('textbox', { name: /City/i }), 'Paris');

    await user.click(getByRole('button', { name: /Create Doctor Profile/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          specialty: 'Cardiology',
          address: '10 Rue de la Paix',
          city: 'Paris',
        }),
        expect.any(Object),
      );
    });
  });

  it('closes dialog on successful mutation', async () => {
    const { getByRole, user, queryByRole } = await setup();

    let onSuccessFn: () => void = () => {};
    mutate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      onSuccessFn = opts.onSuccess;
    });

    await user.type(
      getByRole('textbox', { name: /User UUID/i }),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );
    await user.type(getByRole('textbox', { name: /Specialty/i }), 'Cardiology');
    await user.type(getByRole('textbox', { name: /Address/i }), '10 Rue Test');
    await user.type(getByRole('textbox', { name: /City/i }), 'Paris');

    await user.click(getByRole('button', { name: /Create Doctor Profile/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalled();
    });

    onSuccessFn();

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
