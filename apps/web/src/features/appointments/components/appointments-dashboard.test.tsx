/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/queries';
import { render } from '@/test/render';

import AppointmentsDashboard from './appointments-dashboard';

vi.mock('@/queries', () => ({
  useListAppointments: vi.fn().mockReturnValue({ data: undefined, error: null, isLoading: true }),
  useCreateAppointment: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const fakeSession = { isAuthenticated: true, userId: 'u1' };

describe('AppointmentsDashboard', () => {
  it('renders nothing when session is null', () => {
    const { container } = render(<AppointmentsDashboard session={null} />);
    expect(container.querySelector('.space-y-6')).not.toBeInTheDocument();
  });

  it('renders nothing when session is not authenticated', () => {
    const { container } = render(
      <AppointmentsDashboard session={{ isAuthenticated: false, userId: '' }} />,
    );
    expect(container.querySelector('.space-y-6')).not.toBeInTheDocument();
  });

  it('renders table with title when authenticated', () => {
    vi.mocked(queries.useListAppointments).mockReturnValue({
      data: { appointments: [], totalItems: 0, totalPages: 0, page: 1, perPage: 10 },
      error: null,
      isLoading: false,
    } as any);

    const { getByText } = render(<AppointmentsDashboard session={fakeSession} />);

    expect(getByText('Appointments Management')).toBeInTheDocument();
  });

  it('shows error toast when query errors', async () => {
    const { toast } = await import('sonner');

    vi.mocked(queries.useListAppointments).mockReturnValue({
      data: undefined,
      error: new Error('Server down'),
      isLoading: false,
    } as any);

    render(<AppointmentsDashboard session={fakeSession} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Server down'));
    });
  });
});
