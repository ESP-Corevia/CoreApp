import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { DocumentActionsMenu } from './document-actions-menu';
import type { AdminDocument } from './documents-table';

vi.mock('@/queries', () => ({
  useAdminDocumentDownloadUrl: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useHardDeleteDocument: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useRestoreDocument: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useSoftDeleteDocument: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

const makeDocument = (overrides: Partial<AdminDocument> = {}): AdminDocument => ({
  id: 'doc-1',
  userId: 'user-1',
  userName: 'Alice Smith',
  userEmail: 'alice@example.com',
  fileName: 'report.pdf',
  fileKey: 'uploads/report.pdf',
  mimeType: 'application/pdf',
  fileSize: 204800,
  status: 'active',
  deletedAt: null,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('DocumentActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the menu trigger button', () => {
    const { getByRole } = render(<DocumentActionsMenu document={makeDocument()} />);
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('shows Download, Soft Delete, and Permanently Delete for active documents', async () => {
    const user = userEvent.setup();
    const { getByRole, queryByText } = render(<DocumentActionsMenu document={makeDocument()} />);

    await user.click(getByRole('button'));

    expect(queryByText('Download')).toBeInTheDocument();
    expect(queryByText('Soft Delete')).toBeInTheDocument();
    expect(queryByText('Permanently Delete')).toBeInTheDocument();
    expect(queryByText('Restore')).not.toBeInTheDocument();
  });

  it('shows Download, Restore, and Permanently Delete for soft-deleted documents', async () => {
    const user = userEvent.setup();
    const { getByRole, queryByText } = render(
      <DocumentActionsMenu document={makeDocument({ deletedAt: '2024-02-01T00:00:00Z' })} />,
    );

    await user.click(getByRole('button'));

    expect(queryByText('Download')).toBeInTheDocument();
    expect(queryByText('Restore')).toBeInTheDocument();
    expect(queryByText('Permanently Delete')).toBeInTheDocument();
    expect(queryByText('Soft Delete')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when clicking Permanently Delete', async () => {
    const user = userEvent.setup();
    const { getByRole, queryByText } = render(<DocumentActionsMenu document={makeDocument()} />);

    await user.click(getByRole('button'));
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    await user.click(queryByText('Permanently Delete')!);

    expect(getByRole('alertdialog')).toBeInTheDocument();
  });
});
