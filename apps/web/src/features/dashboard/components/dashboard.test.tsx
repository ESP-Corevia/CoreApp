import { waitFor } from '@testing-library/react';
import { vi } from 'vitest';

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
    const { queryByText } = render(<Dashboard session={null} />, {
      router: { initialEntries: ['/dashboard'] },
    });
    await waitFor(() => {
      expect(queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  it('shows loading state when auth is pending', async () => {
    const mockHandler = vi.fn(() => ({ isLoading: true }));
    const { getByText } = render(<Dashboard session={{ isAuthenticated: true, userId: '123' }} />, {
      trpcHandlers: {
        privateData: mockHandler,
      },
    });
    expect(mockHandler).toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('shows private data when authenticated', async () => {
    const mockHandler = vi.fn(() => ({ message: 'ok-from-mock', user: 123 }));
    const { getByRole, getByText } = render(
      <Dashboard session={{ isAuthenticated: true, userId: '123' }} />,
      {
        trpcHandlers: {
          privateData: mockHandler,
        },
      }
    );
    await waitFor(() => {
      expect(getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();

      expect(getByText('Welcome 123')).toBeInTheDocument();
      expect(mockHandler).toHaveBeenCalled();
    });

    await waitFor(() => expect(getByText('privateData: ok-from-mock')).toBeInTheDocument());
  });
});
