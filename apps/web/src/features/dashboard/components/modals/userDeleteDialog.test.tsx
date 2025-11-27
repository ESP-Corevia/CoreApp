import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as queries from '@/queries';
import { mockUser } from '@/test/faker';
import { render } from '@/test/render';

import { DeleteUserDialog } from './userDeleteDialog';

vi.mock('@/queries', () => ({
  useDeleteUser: vi.fn().mockReturnValue({ mutate: vi.fn() }),
}));

describe('DeleteUserDialog', () => {
  const onOpenChange = vi.fn();
  const mutate = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
  });
  vi.mocked(queries.useDeleteUser).mockReturnValue({ mutate } as any);
  const setup = () => render(<DeleteUserDialog open onOpenChange={onOpenChange} user={mockUser} />);

  it('renders dialog with correct title and content', () => {
    const { getByRole } = setup();

    expect(getByRole('alertdialog', { name: 'Delete User' })).toBeInTheDocument();

    const description = getByRole('paragraph');
    expect(description).toHaveTextContent(`delete ${mockUser.name}`);
    expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls delete mutation with user ID when clicking Delete', async () => {
    const { getByRole } = setup();
    const user = userEvent.setup();

    await user.click(getByRole('button', { name: 'Delete' }));

    expect(mutate).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
  });

  it('closes dialog on successful delete', async () => {
    const { getByRole } = setup();
    const user = userEvent.setup();

    let onSuccessFn: () => void = () => {};

    mutate.mockImplementation((_id, opts) => {
      onSuccessFn = opts.onSuccess;
    });

    await user.click(getByRole('button', { name: 'Delete' }));
    // Simulate successful deletion
    onSuccessFn();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading state while deleting', () => {
    vi.mocked(queries.useDeleteUser).mockReturnValue({
      mutate,
      isPending: true,
    } as any);

    const { getByRole } = setup();

    expect(getByRole('button', { name: 'Deleting...' })).toBeDisabled();
  });
});
