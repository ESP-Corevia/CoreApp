import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { render } from '@/test/render';

import SignInForm from './sign-in-form';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: {
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

describe('SignInForm', () => {
  const mockOnSwitchToSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as any);
  });

  it('renders the sign-in form correctly', () => {
    const { getByRole, getByLabelText, getByText } = render(
      <SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />
    );

    expect(getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByLabelText('Password')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(getByText('Need an account? Sign Up')).toBeInTheDocument();
  });

  it('shows loader when session is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    } as any);

    const { getByText } = render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

    expect(getByText('Loading')).toBeInTheDocument();
  });

  it('displays validation error for invalid email', async () => {
    const user = userEvent.setup();
    const { getByRole, queryByText } = render(
      <SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />
    );

    // const emailInput = getByLabelText('Email');
    const submitButton = getByRole('button', { name: 'Sign In' });

    // await user.type(emailInput, 'invalid-email');
    // await user.tab();

    await user.click(submitButton);

    await waitFor(() => {
      expect(queryByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('displays validation error for short password', async () => {
    const user = userEvent.setup();
    const { getByLabelText, getByRole, queryByText } = render(
      <SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />
    );

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'short');

    await user.click(submitButton);

    await waitFor(() => {
      expect(queryByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('calls sign-in on form submission with valid data', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.fn();
    vi.mocked(authClient.signIn.email).mockImplementation(mockSignIn);

    const { getByLabelText, getByRole } = render(
      <SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />
    );

    const emailInput = getByLabelText('Email');
    const passwordInput = getByLabelText('Password');
    const submitButton = getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        expect.any(Object)
      );
    });
  });

  it('calls onSwitchToSignUp when sign up link is clicked', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<SignInForm onSwitchToSignUp={mockOnSwitchToSignUp} />);

    const signUpLink = getByRole('button', { name: 'Need an account? Sign Up' });
    await user.click(signUpLink);

    expect(mockOnSwitchToSignUp).toHaveBeenCalled();
  });
});
