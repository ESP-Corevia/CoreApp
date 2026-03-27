/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import PatientsDashboard from './patients-dashboard';

vi.mock('@/queries', () => ({
  useListPatients: vi.fn().mockReturnValue({ data: undefined, error: null, isLoading: true }),
  useCreatePatient: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const fakeSession = { isAuthenticated: true, userId: 'u1' };

describe('PatientsDashboard', () => {
  it('renders nothing when session is null', () => {
    const { container } = render(<PatientsDashboard session={null} />);
    expect(container.querySelector('.space-y-6')).not.toBeInTheDocument();
  });

  it('renders nothing when session is not authenticated', () => {
    const { container } = render(
      <PatientsDashboard session={{ isAuthenticated: false, userId: '' }} />,
    );
    expect(container.querySelector('.space-y-6')).not.toBeInTheDocument();
  });

  it('renders table with title when authenticated', () => {
    vi.mocked(queries.useListPatients).mockReturnValue({
      data: { patients: [], totalItems: 0, totalPages: 0, page: 1, perPage: 10 },
      error: null,
      isLoading: false,
    } as any);

    const { getByText } = render(<PatientsDashboard session={fakeSession} />);

    expect(getByText('Patients Management')).toBeInTheDocument();
  });

  it('shows error toast when query errors', async () => {
    const { toast } = await import('sonner');

    vi.mocked(queries.useListPatients).mockReturnValue({
      data: undefined,
      error: new Error('Network error'),
      isLoading: false,
    } as any);

    render(<PatientsDashboard session={fakeSession} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });
  });
});
