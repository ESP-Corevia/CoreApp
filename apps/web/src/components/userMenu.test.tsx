import { waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { authClient } from '@/lib/auth-client';
import UserMenu from './userMenu';
import { render } from '@/test/render';
import { mockUser } from '@/test/faker';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe('UserMenu', () => {
  it('renders sign in button when there is no session and calls signIn on click', async () => {
    (authClient.useSession as any).mockReturnValue({ data: null, isPending: false });
    const { getByRole, queryByRole, findByRole } = render(<UserMenu />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: null }),
      },
    });
    expect(queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument();
    const signInLink = await findByRole('link', { name: 'Sign In' });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('renders sign out button when session exists and calls signOut on click', async () => {
    (authClient.useSession as any).mockReturnValue({
      data: { userId: '123' },
      isPending: false,
      isLoading: false,
      isError: false,
    });
    const mockSignOut = vi.fn();
    vi.mocked(authClient.signOut).mockImplementation(mockSignOut);
    const { findByRole } = render(<UserMenu />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    const button = await findByRole('button', { name: 'Sign Out' });

    userEvent.click(button);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
