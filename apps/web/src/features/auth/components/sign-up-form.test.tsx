import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { render } from '@/test/render';

import SignUpForm from './sign-up-form';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signUp: {
      email: vi.fn(),
    },
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SignUpForm', () => {
  const mockOnSwitchToSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as any);
  });

  it('renders the sign-up form correctly', () => {
    const { getByRole, getByLabelText, getByText } = render(
      <SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />
    );

    expect(getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(getByLabelText('Name')).toBeInTheDocument();
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByLabelText('Password')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(getByText('Already have an account? Sign In')).toBeInTheDocument();
  });

  it('shows loader when session is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    } as any);

    const { getByText } = render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

    expect(getByText('Loading')).toBeInTheDocument();
  });

  it('displays validation error for empty name', async () => {
    const user = userEvent.setup();
    const { getByLabelText, getByRole, container } = render(
      <SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />
    );

    const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: 'Sign Up' });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      const errorText = container.textContent;
      expect(errorText).toContain('Name must be at least 2 characters');
    });
  });

  it('displays validation error for empty email', async () => {
    const user = userEvent.setup();
    const { getByLabelText, getByRole, container } = render(
      <SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />
    );

    const nameInput = getByLabelText('Name');
    const submitButton = getByRole('button', { name: 'Sign Up' });

    await user.type(nameInput, 'John Doe');
    await user.click(submitButton);

    await waitFor(() => {
      const errorText = container.textContent;
      expect(errorText).toContain('Invalid email address');
    });
  });

  it('displays validation error for short password', async () => {
    const user = userEvent.setup();
    const { getByLabelText, getByRole, container } = render(
      <SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />
    );

    const nameInput = getByLabelText('Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: 'Sign Up' });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'short');
    await user.click(submitButton);

    await waitFor(() => {
      const errorText = container.textContent;
      expect(errorText).toContain('Password must be at least 8 characters');
    });
  });

  it('calls sign-up on form submission with valid data', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signUp.email).mockImplementation((credentials, callbacks) => {
      if (callbacks?.onSuccess) {
        void callbacks.onSuccess({} as any);
      }
      return Promise.resolve();
    });

    const { getByLabelText, getByRole } = render(
      <SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />
    );

    const nameInput = getByLabelText('Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: 'Sign Up' });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(vi.mocked(authClient.signUp.email)).toHaveBeenCalledWith(
        {
          email: 'john@example.com',
          password: 'password123',
          name: 'John Doe',
        },
        expect.any(Object)
      );
    });
  });

  it('calls onSwitchToSignIn when sign in link is clicked', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const signInLink = getByRole('button', { name: 'Already have an account? Sign In' });
    await user.click(signInLink);

    expect(mockOnSwitchToSignIn).toHaveBeenCalled();
  });

  it('shows submitting state while form is being submitted', async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signUp.email).mockImplementation((credentials, callbacks) => {
      return new Promise(resolve => {
        setTimeout(() => {
          if (callbacks?.onSuccess) {
            void callbacks.onSuccess({} as any);
          }
          resolve(undefined);
        }, 100);
      });
    });

    const { getByLabelText, getByRole } = render(
      <SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />
    );

    const nameInput = getByLabelText('Name');
    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: 'Sign Up' });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    });
  });
});
