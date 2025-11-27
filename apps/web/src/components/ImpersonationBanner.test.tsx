import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { render } from '@/test/render';
import * as useReqAuth from '@/hooks/use-require-auth';
import ImpersonationBanner from './ImpersonationBanner';
import userEvent from '@testing-library/user-event';
vi.mock('@/hooks/use-require-auth', () => ({
  useRequireAuth: vi.fn(),
}));

const mockUseRequireAuth = vi.mocked(useReqAuth.useRequireAuth);

describe('ImpersonationBanner', () => {
  let originalWindowName: string;
  let originalWindowClose: () => void;

  beforeEach(() => {
    originalWindowName = window.name;
    originalWindowClose = window.close;

    window.close = vi.fn();
  });

  afterEach(() => {
    window.name = originalWindowName;
    window.close = originalWindowClose;
  });

  it('does not render when not impersonating', () => {
    window.name = 'regular-window';
    mockUseRequireAuth.mockReturnValue({
      isLoading: false,
      error: null,
      isAuthorized: true,
      session: {
        impersonatedBy: null,
        isAuthenticated: true,
        userId: 'user123',
      },
    });

    const { queryByText } = render(<ImpersonationBanner />);

    expect(queryByText('You are currently impersonating a user.')).toBeNull();
  });

  it('renders banner when impersonating', async () => {
    window.name = 'impersonation-window';
    mockUseRequireAuth.mockReturnValue({
      isLoading: false,
      error: null,
      isAuthorized: true,
      session: {
        impersonatedBy: 'admin123',
        isAuthenticated: true,
        userId: 'user123',
      },
    });

    const { getByRole, getByText } = render(<ImpersonationBanner />);

    expect(getByText('You are currently impersonating a user.')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Exit impersonation' })).toBeInTheDocument();
  });

  it('calls window.close when Exit impersonation is clicked', async () => {
    window.name = 'impersonation-window';
    mockUseRequireAuth.mockReturnValue({
      isLoading: false,
      error: null,
      isAuthorized: true,
      session: {
        impersonatedBy: 'admin123',
        isAuthenticated: true,
        userId: 'user123',
      },
    });

    const { getByRole } = render(<ImpersonationBanner />);

    const button = getByRole('button', {
      name: 'Exit impersonation',
    });

    userEvent.click(button);

    await waitFor(() => {
      expect(window.close).toHaveBeenCalled();
    });
  });
});
