import { waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { authClient } from '@/lib/auth-client';
import { render } from '@/test/render';

import Dashboard from './dashboard';
// Mock the auth client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login if not authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: 'Not Authenticated',
    } as any);

    const { queryByText } = render(<Dashboard />, {
      router: { initialEntries: ['/dashboard'] },
    });
    await waitFor(() => {
      expect(queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  it('shows loading state when auth is pending', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    } as any);
    const mockHandler = vi.fn(() => ({ message: 'ok-from-mock' }));
    const { getByText } = render(<Dashboard />, {
      trpcHandlers: {
        privateData: mockHandler,
      },
    });
    expect(mockHandler).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('shows private data when authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { userId: '123' },
      isPending: false,
      error: null,
    } as any);
    const mockHandler = vi.fn(() => ({ message: 'ok-from-mock' }));
    const { getByRole, getByText } = render(<Dashboard />, {
      trpcHandlers: {
        privateData: mockHandler,
      },
    });

    expect(getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();

    expect(getByText('Welcome 123')).toBeInTheDocument();
    expect(mockHandler).toHaveBeenCalled();

    await waitFor(() => expect(getByText('privateData: ok-from-mock')).toBeInTheDocument());
  });
});
