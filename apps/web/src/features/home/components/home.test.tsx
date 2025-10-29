import { waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { render } from '@/test/render';

import Home from './home';

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const session = { isAuthenticated: true, userId: '123' };
  it('renders the home page with title text', () => {
    const { container } = render(<Home session={session} />);

    const h1Element = container.querySelector('h1');
    expect(h1Element).toBeInTheDocument();
    expect(h1Element).toHaveAttribute('aria-label', 'Corevia');
  });

  it('renders API Status section', () => {
    const { getByText } = render(<Home session={session} />);

    expect(getByText('API Status')).toBeInTheDocument();
  });

  it('displays "Checking..." when health check is loading', () => {
    const mockHandler = vi.fn(() => new Promise(() => {}));

    const { getByText } = render(<Home session={session} />, {
      trpcHandlers: {
        healthCheck: mockHandler,
      },
    });

    expect(getByText('Checking...')).toBeInTheDocument();
  });

  it('displays "Connected" with green indicator when health check succeeds', async () => {
    const mockHandler = vi.fn(() => true);

    const { getByText, container } = render(<Home session={session} />, {
      trpcHandlers: {
        healthCheck: mockHandler,
      },
    });

    await waitFor(() => {
      expect(getByText('Connected')).toBeInTheDocument();
    });

    const statusIndicator = container.querySelector('.bg-green-500');
    expect(statusIndicator).toBeInTheDocument();
    expect(mockHandler).toHaveBeenCalled();
  });

  it('displays "Disconnected" with red indicator when health check fails', async () => {
    const mockHandler = vi.fn(() => {
      throw new Error('Health check failed');
    });

    const { getByText, container } = render(<Home session={session} />, {
      trpcHandlers: {
        healthCheck: mockHandler,
      },
    });

    await waitFor(() => {
      expect(getByText('Disconnected')).toBeInTheDocument();
    });

    const statusIndicator = container.querySelector('.bg-red-500');
    expect(statusIndicator).toBeInTheDocument();
    expect(mockHandler).toHaveBeenCalled();
  });

  it('displays "Disconnected" with red indicator when health check returns falsy value', async () => {
    const mockHandler = vi.fn(() => false);

    const { getByText, container } = render(<Home session={session} />, {
      trpcHandlers: {
        healthCheck: mockHandler,
      },
    });

    await waitFor(() => {
      expect(getByText('Disconnected')).toBeInTheDocument();
    });

    const statusIndicator = container.querySelector('.bg-red-500');
    expect(statusIndicator).toBeInTheDocument();
    expect(mockHandler).toHaveBeenCalled();
  });

  it('renders with proper container and styling classes', () => {
    const { container } = render(<Home session={session} />);

    const mainContainer = container.querySelector('.container');

    expect(mainContainer).toHaveClass(
      'mx-auto',
      'flex',
      'min-h-screen',
      'max-w-5xl',
      'flex-col',
      'items-center',
      'justify-center',
      'px-4',
      'py-6',
      'sm:px-6',
      'lg:px-8'
    );

    const section = container.querySelector('section');
    expect(section).toHaveClass('rounded-lg', 'border', 'p-4');
  });

  it('displays the status indicator as a small circle', () => {
    const mockHandler = vi.fn(() => true);

    const { container } = render(<Home session={session} />, {
      trpcHandlers: {
        healthCheck: mockHandler,
      },
    });

    const indicator = container.querySelector('.h-2.w-2.rounded-full');
    expect(indicator).toBeInTheDocument();
  });
  it('redirects to login if not authenticated', async () => {
    const { container } = render(<Home session={null} />);
    const h1Element = container.querySelector('h1');
    expect(h1Element).not.toBeInTheDocument();
  });
});
