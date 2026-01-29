import { faker } from '@faker-js/faker';
import { waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { vi } from 'vitest';

import { render } from '@/test/render';

import { useListUsers } from '../../../queries';

import Dashboard from './dashboard';

vi.mock('sonner', () => {
  return {
    toast: {
      error: vi.fn(),
    },
  };
});
vi.mock('../../../queries', () => ({
  useListUsers: vi.fn(),
}));
export const mockTableProps: any = {};

vi.mock('./table', () => ({
  default: (props: any) => {
    Object.assign(mockTableProps, props);
    return <div>Mocked DataTableUsers</div>;
  },
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls privateData query when authenticated', async () => {
    const mockPrivate = vi.fn(() => ({ ok: true }));
    (useListUsers as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    render(<Dashboard session={{ isAuthenticated: true, userId: '123' }} />, {
      trpcHandlers: { privateData: mockPrivate },
    });

    await waitFor(() => {
      expect(mockPrivate).toHaveBeenCalledTimes(1);
    });
  });

  it('loads users using useListUsers and passes data to table', async () => {
    const user = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      createdAt: faker.date.past(),
      updatedAt: null,
      image: null,
      lastLoginMethod: 'email',
      emailVerified: true,
      role: 'user',
    };
    (useListUsers as any).mockReturnValue({
      data: { users: [user], totalItems: 1 },
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<Dashboard session={{ isAuthenticated: true, userId: '123' }} />);

    await waitFor(() => {
      expect(useListUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          perPage: 10,
          search: '',
        })
      );
    });
    expect(getByText('Mocked DataTableUsers')).toBeInTheDocument();
  });

  it('shows toast error when user loading fails', async () => {
    (useListUsers as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('BOOM'),
    });

    render(<Dashboard session={{ isAuthenticated: true, userId: '123' }} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load users'));
    });
  });

  it('updates search and resets page when search changes', async () => {
    (useListUsers as any).mockReturnValue({
      data: { users: [], totalItems: 0 },
      isLoading: false,
      error: null,
    });

    render(<Dashboard session={{ isAuthenticated: true, userId: '123' }} />);

    await mockTableProps.onSearchChange('john');

    await waitFor(() => {
      expect(useListUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'john',
          page: 1,
        })
      );
    });
  });

  it('handles sorting change', async () => {
    (useListUsers as any).mockReturnValue({
      data: { users: [], totalItems: 0 },
      isLoading: false,
      error: null,
    });

    render(<Dashboard session={{ isAuthenticated: true, userId: '123' }} />);

    const sorting = { id: 'name', desc: false };

    await mockTableProps.onSortingChange(sorting);

    await waitFor(() => {
      expect(useListUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sorting,
        })
      );
    });
  });

  it('handles filters change', async () => {
    (useListUsers as any).mockReturnValue({
      data: { users: [], totalItems: 0 },
      isLoading: false,
      error: null,
    });

    render(<Dashboard session={{ isAuthenticated: true, userId: '123' }} />);

    const newFilters = [{ id: 'role', value: 'admin' }];

    await mockTableProps.onFiltersChange(newFilters);

    await waitFor(() => {
      expect(useListUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: newFilters,
        })
      );
    });
  });
});
