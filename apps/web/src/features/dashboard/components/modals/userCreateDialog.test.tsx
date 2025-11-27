import * as queryClient from '@tanstack/react-query';

import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { render } from '@/test/render';

import { CreateUserDialog } from './userCreateDialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      createUser: vi.fn(),
    },
  },
}));

vi.mock('@tanstack/react-query', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, any>;

  return {
    ...actual,
    useQueryClient: vi.fn().mockReturnValue({
      invalidateQueries: vi.fn(),
    }),
  };
});

describe('CreateUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = async () => {
    const ui = render(<CreateUserDialog />);
    const user = userEvent.setup();

    await user.click(ui.getByRole('button', { name: 'Create User' }));

    return { ...ui, user };
  };

  it('renders dialog correctly when opened', async () => {
    const { getByRole, getByLabelText } = await setup();

    expect(getByRole('dialog', { name: 'Create New User' })).toBeInTheDocument();
    expect(getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    expect(getByRole('textbox', { name: 'First Name' })).toBeInTheDocument();
    expect(getByRole('textbox', { name: 'Last Name' })).toBeInTheDocument();
    expect(getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(getByLabelText('Password')).toBeInTheDocument();
    expect(getByRole('combobox', { name: 'Role' })).toBeInTheDocument();
  });

  it('shows validation errors for invalid input', async () => {
    const { getByRole, getByText, user } = await setup();

    await user.type(getByRole('textbox', { name: 'Name' }), 'a');
    await user.click(getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('changes role via select', async () => {
    const { getByRole, findByRole, user } = await setup();

    await user.click(getByRole('combobox', { name: 'Role' }));
    const adminOption = await findByRole('option', { name: 'Admin' });

    await user.click(adminOption);

    expect(getByRole('combobox')).toHaveTextContent('Admin');
  });

  it('toggles password visibility', async () => {
    const { getByRole, user, getByLabelText } = await setup();

    const pwd = getByLabelText('Password') as HTMLInputElement;
    let toggle = getByRole('button', { name: 'Show password' });

    expect(pwd.type).toBe('password');

    await user.click(toggle);

    expect(pwd.type).toBe('text');

    toggle = getByRole('button', { name: 'Hide password' });

    await user.click(toggle);

    expect(pwd.type).toBe('password');
  });

  it('submits form and creates user', async () => {
    const mockInvalidate = vi.fn();

    vi.mocked(queryClient.useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidate,
    } as any);

    vi.mocked(authClient.admin.createUser).mockResolvedValueOnce(undefined);

    const { getByRole, user, getByLabelText } = await setup();

    await user.type(getByRole('textbox', { name: 'Name' }), 'John Doe');
    await user.type(getByRole('textbox', { name: 'First Name' }), 'John');
    await user.type(getByRole('textbox', { name: 'Last Name' }), 'Doe');
    await user.type(getByRole('textbox', { name: 'Email' }), 'john@example.com');
    await user.type(getByLabelText('Password'), '12345678');

    await user.click(getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(authClient.admin.createUser).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: '12345678',
        name: 'John Doe',
        data: { firstName: 'John', lastName: 'Doe' },
        role: 'user',
      });
    });

    expect(toast.success).toHaveBeenCalled();
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('shows toast on error', async () => {
    vi.mocked(authClient.admin.createUser).mockRejectedValueOnce(new Error('fail'));

    const { getByRole, user, getByLabelText } = await setup();

    await user.type(getByRole('textbox', { name: 'Name' }), 'John Doe');
    await user.type(getByRole('textbox', { name: 'First Name' }), 'John');
    await user.type(getByRole('textbox', { name: 'Last Name' }), 'Doe');
    await user.type(getByRole('textbox', { name: 'Email' }), 'john@example.com');
    await user.type(getByLabelText('Password'), '12345678');

    await user.click(getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
