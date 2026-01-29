import * as queryClient from '@tanstack/react-query';

import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { mockUser } from '@/test/faker';
import { render } from '@/test/render';

import { EditUserDialog } from './userEditDialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// // mock TRPC provider
// vi.mock('@/providers/trpc', () => ({
//   useTrpc: () => ({
//     admin: {
//       listUsers: {
//         queryFilter: () => ({ queryKey: ['users'] }),
//       },
//     },
//   }),
// }));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      updateUser: vi.fn(),
      setRole: vi.fn(),
    },
  },
}));

// mock query client
vi.mock('@tanstack/react-query', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    useQueryClient: vi.fn().mockReturnValue({
      invalidateQueries: vi.fn(),
    }),
  };
});

describe('EditUserDialog', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    const ui = render(<EditUserDialog open onOpenChange={onOpenChange} user={mockUser} />);
    const user = userEvent.setup();

    return { ...ui, user };
  };

  it('renders dialog with correct default values', () => {
    const { getByRole, getByDisplayValue } = setup();

    expect(getByRole('dialog', { name: 'Edit User' })).toBeInTheDocument();

    expect(getByDisplayValue(mockUser.name)).toBeInTheDocument();
    expect(getByDisplayValue(mockUser.email)).toBeInTheDocument();

    expect(getByRole('combobox', { name: 'Role' })).toHaveTextContent('User');
  });

  it('shows validation errors', async () => {
    const { getByRole, user, getByText } = setup();
    expect(getByRole('dialog', { name: 'Edit User' })).toBeInTheDocument();

    await user.clear(getByRole('textbox', { name: 'Name' }));
    await user.type(getByRole('textbox', { name: 'Name' }), 'a');
    await user.click(getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('updates role via select', async () => {
    const { getByRole, findByRole, user } = setup();

    await user.click(getByRole('combobox', { name: 'Role' }));
    await user.click(await findByRole('option', { name: 'Admin' }));

    expect(getByRole('combobox')).toHaveTextContent('Admin');
  });

  it('submits form and updates user', async () => {
    const mockInvalidate = vi.fn();
    vi.mocked(queryClient.useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidate,
    } as any);

    vi.mocked(authClient.admin.updateUser).mockResolvedValueOnce(undefined);
    vi.mocked(authClient.admin.setRole).mockResolvedValueOnce(undefined);

    const { getByRole, user, findByRole } = setup();

    await user.clear(getByRole('textbox', { name: 'Name' }));
    await user.type(getByRole('textbox', { name: 'Name' }), 'Johnny Doe');

    await user.click(getByRole('combobox', { name: 'Role' }));
    await user.click(await findByRole('option', { name: 'Admin' }));

    await user.click(getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(authClient.admin.setRole).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: 'admin',
      });
      expect(authClient.admin.updateUser).toHaveBeenCalledWith({
        userId: mockUser.id,
        data: {
          name: 'Johnny Doe',
        },
      });
    });

    expect(toast.success).toHaveBeenCalled();
    expect(mockInvalidate).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows error toast on failure', async () => {
    vi.mocked(authClient.admin.updateUser).mockRejectedValueOnce(new Error('fail'));

    const { getByRole, user } = setup();

    await user.type(getByRole('textbox', { name: 'Name' }), 'Johnny Doe');
    await user.click(getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('resets form when reopened', async () => {
    const { getByRole, rerender, user } = setup();

    const nameInput = getByRole('textbox', { name: 'Name' });

    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Value');
    expect(nameInput).toHaveValue('Changed Value');

    // close -> open to trigger reset()
    rerender(<EditUserDialog open={false} onOpenChange={onOpenChange} user={mockUser} />);
    rerender(<EditUserDialog open onOpenChange={onOpenChange} user={mockUser} />);

    expect(getByRole('textbox', { name: 'Name' })).toHaveValue(mockUser.name);
  });
});
