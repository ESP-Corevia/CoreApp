import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { render } from '@/test/render';

import Profile from './profile';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    updateUser: vi.fn(),
    changeEmail: vi.fn(),
    changePassword: vi.fn(),
    useSession: vi.fn(() => ({ data: { token: 'current-session-token' } })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Profile', () => {
  const session = { isAuthenticated: true, userId: '123' };
  const mockUser = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the profile page with title text', async () => {
    const { findByRole, getByText } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    const h2Element = await findByRole('heading', { level: 2, name: 'Profile Information' });
    expect(h2Element).toBeInTheDocument();
    expect(h2Element).toHaveTextContent('Profile Information');
    expect(getByText('Your personal details')).toBeInTheDocument();
  });

  it('displays loader when user data is loading', () => {
    const { getByText } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => new Promise(() => {}),
      },
    });

    expect(getByText('Loading')).toBeInTheDocument();
    expect(getByText('Please wait while we process your request.')).toBeInTheDocument();
  });

  it('displays user information correctly', async () => {
    const { findByLabelText } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    const preview = await findByLabelText('Preview Profile Information');
    const scope = within(preview);

    expect(scope.getByText('john@example.com')).toBeVisible();
  });

  it('displays user initials in avatar', async () => {
    const { container } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    await waitFor(() => {
      expect(container.textContent).toContain('J');
    });
  });

  it('renders edit button for profile information', async () => {
    const { getByRole } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    await waitFor(() => {
      expect(getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
    });
  });

  it('renders change email button', async () => {
    const { getByRole } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    await waitFor(() => {
      expect(getByRole('button', { name: 'Change Email' })).toBeInTheDocument();
    });
  });

  it('renders change password button', async () => {
    const { getByRole } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    await waitFor(() => {
      expect(getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
    });
  });

  it('does not fetch user data when session is not authenticated', () => {
    const mockHandler = vi.fn();

    render(<Profile session={null} />, {
      trpcHandlers: {
        'user.getMe': mockHandler,
      },
    });

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('calls updateUser when profile form is submitted', async () => {
    const user = userEvent.setup();
    const mockUpdateUser = vi.fn();
    vi.mocked(authClient.updateUser).mockImplementation(mockUpdateUser);

    const { getByRole, getByLabelText } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    await waitFor(() => {
      expect(getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
    });

    const editButton = getByRole('button', { name: 'Edit Profile' });
    await user.click(editButton);

    await waitFor(() => {
      expect(getByLabelText('Name')).toBeVisible();
    });

    const nameInput = getByLabelText('Name') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Smith');
    const submitButton = getByRole('button', { name: 'Save' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        name: 'Jane Smith',
      });
    });
  });

  it('renders account status section', async () => {
    const { getByText } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    await waitFor(() => {
      expect(getByText('Account Status')).toBeInTheDocument();
      expect(getByText('Verified')).toBeInTheDocument();
    });
  });

  it('opens email change modal when change email button is clicked', async () => {
    const user = userEvent.setup();
    const { getAllByRole, getByRole } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    await waitFor(() => {
      expect(getAllByRole('button', { name: 'Change Email' }).length).toBeGreaterThan(0);
    });

    const emailButtons = getAllByRole('button', { name: 'Change Email' });
    await user.click(emailButtons[0]);

    await waitFor(() => {
      expect(getByRole('button', { name: 'Update Email' })).toBeInTheDocument();
    });
  });

  it('opens password change modal when change password button is clicked', async () => {
    const user = userEvent.setup();
    const { getAllByRole, getByRole } = render(<Profile session={session} />, {
      trpcHandlers: {
        'user.getMe': () => ({ user: mockUser }),
      },
    });

    await waitFor(() => {
      expect(getAllByRole('button', { name: 'Change Password' }).length).toBeGreaterThan(0);
    });

    const passwordButtons = getAllByRole('button', { name: 'Change Password' });
    await user.click(passwordButtons[0]);
    await waitFor(() => {
      expect(getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
    });
  });
});
