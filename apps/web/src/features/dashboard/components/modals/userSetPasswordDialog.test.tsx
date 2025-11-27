import * as queryClient from '@tanstack/react-query';

import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { mockUser } from '@/test/faker';
import { render } from '@/test/render';

import { SetPasswordDialog } from './userSetPasswordDialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      setUserPassword: vi.fn(),
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

describe('SetPasswordDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    const ui = render(<SetPasswordDialog open onOpenChange={vi.fn()} user={mockUser} />);
    const user = userEvent.setup();
    return { ...ui, user };
  };

  it('renders dialog correctly', () => {
    const { getByRole, getByLabelText } = setup();

    expect(getByRole('dialog', { name: 'Set Password' })).toBeInTheDocument();
    expect(getByLabelText('New Password')).toBeInTheDocument();
    expect(getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    const { user, getByLabelText, getByRole, getByText } = setup();

    await user.type(getByLabelText('New Password'), 'a');
    await user.type(getByLabelText('Confirm Password'), 'a');

    await user.click(getByRole('button', { name: 'Set Password' }));

    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(getByText('Confirm password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('shows mismatch error when passwords do not match', async () => {
    const { user, getByLabelText, getByRole, getByText } = setup();

    await user.type(getByLabelText('New Password'), 'password123');
    await user.type(getByLabelText('Confirm Password'), 'password999');

    await user.click(getByRole('button', { name: 'Set Password' }));

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('toggles new password visibility', async () => {
    const { user, getByLabelText, getByRole } = setup();

    const pwd = getByLabelText('New Password') as HTMLInputElement;
    let toggle = getByRole('button', { name: 'Show password' });

    expect(pwd.type).toBe('password');

    await user.click(toggle);
    expect(pwd.type).toBe('text');

    toggle = getByRole('button', { name: 'Hide password' });
    await user.click(toggle);
    expect(pwd.type).toBe('password');
  });

  it('toggles confirm password visibility', async () => {
    const { user, getByLabelText, getByRole } = setup();

    const confirm = getByLabelText('Confirm Password') as HTMLInputElement;
    let toggle = getByRole('button', { name: 'Show confirmed password' });

    expect(confirm.type).toBe('password');

    await user.click(toggle);
    expect(confirm.type).toBe('text');

    toggle = getByRole('button', { name: 'Hide confirmed password' });
    await user.click(toggle);
    expect(confirm.type).toBe('password');
  });

  it('submits form and sets password', async () => {
    const mockInvalidate = vi.fn();

    vi.mocked(queryClient.useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidate,
    } as any);

    vi.mocked(authClient.admin.setUserPassword).mockResolvedValueOnce(undefined);

    const { user, getByLabelText, getByRole } = setup();

    await user.type(getByLabelText('New Password'), 'password123');
    await user.type(getByLabelText('Confirm Password'), 'password123');

    await user.click(getByRole('button', { name: 'Set Password' }));

    await waitFor(() => {
      expect(authClient.admin.setUserPassword).toHaveBeenCalledWith({
        userId: mockUser.id,
        newPassword: 'password123',
      });
    });

    expect(toast.success).toHaveBeenCalled();
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('shows error toast on failure', async () => {
    vi.mocked(authClient.admin.setUserPassword).mockRejectedValueOnce(new Error('fail'));

    const { user, getByLabelText, getByRole } = setup();

    await user.type(getByLabelText('New Password'), 'password123');
    await user.type(getByLabelText('Confirm Password'), 'password123');

    await user.click(getByRole('button', { name: 'Set Password' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('resets form when reopened', async () => {
    const { user, getByLabelText, rerender } = setup();

    await user.type(getByLabelText('New Password'), 'password123');
    expect(getByLabelText('New Password')).toHaveValue('password123');

    // simulate closing + reopening
    rerender(<SetPasswordDialog open={false} onOpenChange={vi.fn()} user={mockUser} />);
    rerender(<SetPasswordDialog open onOpenChange={vi.fn()} user={mockUser} />);

    expect(getByLabelText('New Password')).toHaveValue('');
  });
});
