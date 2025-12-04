import * as queryClient from '@tanstack/react-query';

import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { mockUser } from '@/test/faker';
import { render } from '@/test/render';

import { BanUserDialog } from './userBanDialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    admin: {
      banUser: vi.fn(),
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

describe('BanUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (open = true, onOpenChange = vi.fn()) => {
    return render(<BanUserDialog open={open} onOpenChange={onOpenChange} user={mockUser} />);
  };

  it('renders the dialog when open', () => {
    const { getByRole } = setup(true);

    expect(getByRole('dialog', { name: 'Ban User' })).toBeInTheDocument();
    expect(getByRole('textbox', { name: 'Reason for ban' })).toBeInTheDocument();
    expect(getByRole('combobox', { name: 'Ban Duration' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { queryByRole } = setup(false);
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows validation error when reason is too short', async () => {
    const { getByLabelText, getByRole, getByText } = setup(true);
    const user = userEvent.setup();

    await user.type(getByLabelText('Reason for ban'), 'a');
    await user.click(getByRole('button', { name: 'Ban User' }));

    await waitFor(() => {
      expect(getByText('Reason must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('updates duration via select', async () => {
    const { getByRole, findByRole } = setup(true);
    const user = userEvent.setup();

    await user.click(getByRole('combobox', { name: 'Ban Duration' }));
    const sevenDaysOption = await findByRole('option', { name: '7 Days' });
    await user.click(sevenDaysOption);
    expect(getByRole('combobox')).toHaveTextContent('7 Days');
  });

  it('submits form and bans user', async () => {
    const mockInvalidate = vi.fn();
    const user = userEvent.setup();

    vi.spyOn(queryClient, 'useQueryClient').mockReturnValue({
      invalidateQueries: mockInvalidate,
    } as any);

    (authClient.admin.banUser as any).mockResolvedValueOnce(undefined);

    const onOpenChange = vi.fn();
    const { getByRole, findByRole } = setup(true, onOpenChange);

    await user.type(getByRole('textbox', { name: 'Reason for ban' }), 'Spamming');
    await user.click(getByRole('combobox', { name: 'Ban Duration' }));
    await user.click(await findByRole('option', { name: '1 Day' }));
    await user.click(getByRole('button', { name: 'Ban User' }));

    await waitFor(() => {
      expect(authClient.admin.banUser).toHaveBeenCalledWith({
        userId: mockUser.id,
        banReason: 'Spamming',
        banExpiresIn: 86400,
      });
    });

    expect(toast.success).toHaveBeenCalled();
    expect(mockInvalidate).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows error toast on failure', async () => {
    const user = userEvent.setup();

    (authClient.admin.banUser as any).mockRejectedValueOnce(new Error('Failed'));

    const { getByRole } = setup(true);

    await user.type(getByRole('textbox', { name: 'Reason for ban' }), 'Violation');
    await user.click(getByRole('button', { name: 'Ban User' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to ban user'));
    });
  });

  it('resets form when reopened', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { getByRole, rerender } = setup(true, onOpenChange);

    const reasonInput = getByRole('textbox', { name: 'Reason for ban' });

    await user.type(reasonInput, 'Some Reason');
    expect(reasonInput).toHaveValue('Some Reason');

    rerender(<BanUserDialog open={false} onOpenChange={onOpenChange} user={mockUser} />);
    rerender(<BanUserDialog open onOpenChange={onOpenChange} user={mockUser} />);

    expect(getByRole('textbox', { name: 'Reason for ban' })).toHaveValue('');
  });
});
