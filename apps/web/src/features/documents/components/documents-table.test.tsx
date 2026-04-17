import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';
import type { AdminDocument } from './documents-table';
import DocumentsTable from './documents-table';

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

const mockDocuments: AdminDocument[] = [
  makeDocument(),
  makeDocument({
    id: 'doc-2',
    userName: 'Bob Jones',
    userEmail: 'bob@example.com',
    fileName: 'photo.png',
    mimeType: 'image/png',
    fileSize: 1048576,
    status: 'active',
  }),
];

describe('DocumentsTable', () => {
  it('renders the title', () => {
    const { getByText } = render(
      <DocumentsTable
        data={[]}
        pageCount={0}
        isLoading={false}
        title="Documents Management"
        includeDeleted={false}
      />,
    );

    expect(getByText('Documents Management')).toBeInTheDocument();
  });

  it('renders document rows with file name, user info, file type, and size', () => {
    const { getByText } = render(
      <DocumentsTable
        data={mockDocuments}
        pageCount={1}
        isLoading={false}
        title="Documents"
        includeDeleted={false}
      />,
    );

    // File names
    expect(getByText('report.pdf')).toBeInTheDocument();
    expect(getByText('photo.png')).toBeInTheDocument();

    // User names
    expect(getByText('Alice Smith')).toBeInTheDocument();
    expect(getByText('Bob Jones')).toBeInTheDocument();

    // User emails
    expect(getByText('alice@example.com')).toBeInTheDocument();
    expect(getByText('bob@example.com')).toBeInTheDocument();

    // File type badges
    expect(getByText('PDF')).toBeInTheDocument();
    expect(getByText('PNG')).toBeInTheDocument();

    // File sizes: 200 KB and 1.0 MB
    expect(getByText('200.0 KB')).toBeInTheDocument();
    expect(getByText('1.0 MB')).toBeInTheDocument();
  });

  it('shows "Deleted At" column header when includeDeleted is true', () => {
    const { getByText } = render(
      <DocumentsTable
        data={[]}
        pageCount={0}
        isLoading={false}
        title="Documents"
        includeDeleted={true}
      />,
    );

    expect(getByText('Deleted At')).toBeInTheDocument();
  });

  it('hides "Deleted At" column header when includeDeleted is false', () => {
    const { queryByText } = render(
      <DocumentsTable
        data={[]}
        pageCount={0}
        isLoading={false}
        title="Documents"
        includeDeleted={false}
      />,
    );

    expect(queryByText('Deleted At')).not.toBeInTheDocument();
  });

  it('applies opacity and line-through styling to soft-deleted rows', () => {
    const deletedDoc = makeDocument({
      id: 'doc-deleted',
      fileName: 'deleted-file.pdf',
      deletedAt: '2024-02-01T00:00:00Z',
    });

    const { getByText } = render(
      <DocumentsTable
        data={[deletedDoc]}
        pageCount={1}
        isLoading={false}
        title="Documents"
        includeDeleted={true}
      />,
    );

    const fileNameEl = getByText('deleted-file.pdf');
    // The cell wrapper div should have opacity-50 and line-through classes
    const wrapper = fileNameEl.closest('div');
    expect(wrapper?.className).toMatch(/opacity-50/);
    expect(wrapper?.className).toMatch(/line-through/);
  });

  it('does not apply deleted styling to active rows', () => {
    const { getByText } = render(
      <DocumentsTable
        data={[makeDocument()]}
        pageCount={1}
        isLoading={false}
        title="Documents"
        includeDeleted={false}
      />,
    );

    const fileNameEl = getByText('report.pdf');
    const wrapper = fileNameEl.closest('div');
    expect(wrapper?.className).not.toMatch(/opacity-50/);
    expect(wrapper?.className).not.toMatch(/line-through/);
  });

  it('calls onSearchChange when search input changes', async () => {
    const onSearchChange = vi.fn();
    const userEvent = (await import('@testing-library/user-event')).default;
    const user = userEvent.setup();

    const { getByPlaceholderText } = render(
      <DocumentsTable
        data={[]}
        pageCount={0}
        isLoading={false}
        title="Documents"
        includeDeleted={false}
        search=""
        onSearchChange={onSearchChange}
      />,
    );

    const searchInput = getByPlaceholderText(/search by user name or email/i);
    await user.type(searchInput, 'alice');

    expect(onSearchChange).toHaveBeenCalled();
  });
});
