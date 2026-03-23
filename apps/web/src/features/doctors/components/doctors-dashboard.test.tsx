/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import DoctorsDashboard from './doctors-dashboard';

vi.mock('@/queries', () => ({
  useListDoctors: vi.fn().mockReturnValue({ data: undefined, error: null, isLoading: true }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const fakeSession = { isAuthenticated: true, userId: 'u1' };

describe('DoctorsDashboard', () => {
  it('renders nothing when session is null', () => {
    const { container } = render(<DoctorsDashboard session={null} />);
    expect(container.querySelector('.space-y-6')).not.toBeInTheDocument();
  });

  it('renders nothing when session is not authenticated', () => {
    const { container } = render(
      <DoctorsDashboard session={{ isAuthenticated: false, userId: '' }} />,
    );
    expect(container.querySelector('.space-y-6')).not.toBeInTheDocument();
  });

  it('renders table with title when authenticated', () => {
    vi.mocked(queries.useListDoctors).mockReturnValue({
      data: { doctors: [], totalItems: 0, totalPages: 0, page: 1, perPage: 10 },
      error: null,
      isLoading: false,
    } as any);

    const { getByText } = render(<DoctorsDashboard session={fakeSession} />);

    expect(getByText('Doctors Management')).toBeInTheDocument();
  });

  it('shows error toast when query errors', async () => {
    const { toast } = await import('sonner');

    vi.mocked(queries.useListDoctors).mockReturnValue({
      data: undefined,
      error: new Error('Network error'),
      isLoading: false,
    } as any);

    render(<DoctorsDashboard session={fakeSession} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });
  });
});
