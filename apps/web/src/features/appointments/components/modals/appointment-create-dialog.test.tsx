/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import { AppointmentCreateDialog } from './appointment-create-dialog';

vi.mock('@/queries', () => ({
  useCreateAppointment: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

describe('AppointmentCreateDialog', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.useCreateAppointment).mockReturnValue({
      mutate,
      isPending: false,
    } as any);
  });

  const setup = async () => {
    const ui = render(<AppointmentCreateDialog />);
    const user = userEvent.setup();

    await user.click(ui.getByRole('button', { name: /Create Appointment/i }));

    return { ...ui, user };
  };

  /** Paste text into an input — much faster than user.type for long strings like UUIDs */
  async function fill(user: ReturnType<typeof userEvent.setup>, el: HTMLElement, value: string) {
    await user.click(el);
    await user.paste(value);
  }

  async function fillFormAndSubmit(ui: Awaited<ReturnType<typeof setup>>) {
    const { getByRole, getByLabelText, user } = ui;

    await fill(
      user,
      getByRole('textbox', { name: /Doctor ID/i }),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );
    await fill(
      user,
      getByRole('textbox', { name: /Patient ID/i }),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    );
    await fill(user, getByLabelText(/Date/i), '2099-06-15');

    await user.click(getByRole('combobox', { name: /Time/i }));
    await user.click(getByRole('option', { name: '10:00' }));

    await user.click(getByRole('button', { name: /Create Appointment/i }));
  }

  it('renders dialog correctly when opened', async () => {
    const { getByRole, getByLabelText } = await setup();

    expect(getByRole('dialog', { name: /New Appointment/i })).toBeInTheDocument();
    expect(getByRole('textbox', { name: /Doctor ID/i })).toBeInTheDocument();
    expect(getByRole('textbox', { name: /Patient ID/i })).toBeInTheDocument();
    expect(getByLabelText(/Date/i)).toBeInTheDocument();
    expect(getByRole('combobox', { name: /Time/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const ui = await setup();

    await fillFormAndSubmit(ui);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          date: '2099-06-15',
          time: '10:00',
        }),
        expect.any(Object),
      );
    });
  });

  it('passes onSuccess callback to mutation', async () => {
    let receivedOpts: { onSuccess?: () => void } = {};
    mutate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      receivedOpts = opts;
    });

    const ui = await setup();

    await fillFormAndSubmit(ui);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalled();
    });

    expect(typeof receivedOpts.onSuccess).toBe('function');
  });

  it('shows cancel button that closes dialog', async () => {
    const { getByRole, user, queryByRole } = await setup();

    await user.click(getByRole('button', { name: /Cancel/i }));

    await waitFor(() => {
      expect(queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
