import { waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as queries from '@/queries';
import { mockUser } from '@/test/faker';
import { render } from '@/test/render';

import { UserActionsMenu } from './userActionsMenu';

vi.mock('@/queries', () => ({
  useImpersonateUser: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useUnbanUser: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useRevokeUserSessions: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useDeleteUser: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useBanUser: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useSetPassword: vi.fn().mockReturnValue({ mutate: vi.fn() }),
}));

describe('UserActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dropdown trigger', () => {
    const { getByRole } = render(<UserActionsMenu user={mockUser} />);
    expect(getByRole('button', { name: 'Open user menu' })).toBeInTheDocument();
  });

  it('opens the menu when clicked', async () => {
    const { getByRole } = render(<UserActionsMenu user={mockUser} />);
    const menu = getByRole('button', { name: 'Open user menu' });
    await userEvent.click(menu);

    expect(getByRole('menuitem', { name: 'Edit User' })).toBeInTheDocument();
    expect(getByRole('menuitem', { name: 'Set Password' })).toBeInTheDocument();
    expect(getByRole('menuitem', { name: 'Impersonate' })).toBeInTheDocument();
    expect(getByRole('menuitem', { name: 'Ban User' })).toBeInTheDocument();
    expect(getByRole('menuitem', { name: 'Delete User' })).toBeInTheDocument();
    expect(getByRole('menuitem', { name: 'Revoke all Sessions' })).toBeInTheDocument();
  });

  it('opens Edit User dialog', async () => {
    const { getByRole } = render(<UserActionsMenu user={mockUser} />);
    const menu = getByRole('button', { name: 'Open user menu' });
    await userEvent.click(menu);

    await userEvent.click(getByRole('menuitem', { name: 'Edit User' }));
    await waitFor(() => {
      expect(getByRole('dialog', { name: 'Edit User' })).toBeInTheDocument();
    });
  });

  it('opens Set Password dialog', async () => {
    const { getByRole } = render(<UserActionsMenu user={mockUser} />);
    const menu = getByRole('button', { name: 'Open user menu' });
    await userEvent.click(menu);

    await userEvent.click(getByRole('menuitem', { name: 'Set Password' }));

    await waitFor(() => {
      expect(getByRole('dialog', { name: 'Set Password' })).toBeInTheDocument();
    });
  });

  it('calls impersonateUser.mutate with the correct ID', async () => {
    const mockMutate = vi.fn();
    vi.mocked(queries.useImpersonateUser).mockReturnValue({ mutate: mockMutate } as any);
    const { getByRole } = render(<UserActionsMenu user={mockUser} />);
    const menu = getByRole('button', { name: 'Open user menu' });
    await userEvent.click(menu);

    await userEvent.click(getByRole('menuitem', { name: 'Impersonate' }));

    expect(mockMutate).toHaveBeenCalledWith(mockUser.id);
  });

  it('opens Ban dialog when user is not banned', async () => {
    const { getByRole } = render(<UserActionsMenu user={{ ...mockUser, banned: false }} />);
    const menu = getByRole('button', { name: 'Open user menu' });
    await userEvent.click(menu);

    await userEvent.click(getByRole('menuitem', { name: 'Ban User' }));

    await waitFor(() => {
      expect(getByRole('dialog', { name: 'Ban User' })).toBeInTheDocument();
    });
  });

  it('calls unbanUser.mutate when user is banned', async () => {
    const mockMutate = vi.fn();
    vi.mocked(queries.useUnbanUser).mockReturnValue({ mutate: mockMutate } as any);

    const { getByRole } = render(<UserActionsMenu user={{ ...mockUser, banned: true }} />);
    const menu = getByRole('button', { name: 'Open user menu' });
    await userEvent.click(menu);

    await userEvent.click(getByRole('menuitem', { name: 'Unban User' }));

    expect(mockMutate).toHaveBeenCalledWith(mockUser.id);
  });

  it('opens Delete User dialog', async () => {
    const { getByRole } = render(<UserActionsMenu user={mockUser} />);
    const menu = getByRole('button', { name: 'Open user menu' });
    await userEvent.click(menu);

    await userEvent.click(getByRole('menuitem', { name: 'Delete User' }));

    await waitFor(() => {
      expect(getByRole('alertdialog', { name: 'Delete User' })).toBeInTheDocument();
    });
  });

  it('calls revokeSessions.mutate', async () => {
    const mockMutate = vi.fn();
    vi.mocked(queries.useRevokeUserSessions).mockReturnValue({ mutate: mockMutate } as any);

    const { getByRole } = render(<UserActionsMenu user={mockUser} />);
    const menu = getByRole('button', { name: 'Open user menu' });
    await userEvent.click(menu);

    await userEvent.click(getByRole('menuitem', { name: 'Revoke all Sessions' }));

    expect(mockMutate).toHaveBeenCalledWith(mockUser.id);
  });
});
