import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import DocumentsDashboard from './documents-dashboard';

// Mock useListDocuments
vi.mock('@/queries', () => ({
  useListDocuments: vi.fn().mockReturnValue({
    data: {
      documents: [
        {
          id: 'doc-1',
          userId: 'user-1',
          userName: 'Alice',
          userEmail: 'alice@test.com',
          fileName: 'report.pdf',
          fileKey: 'users/user-1/report.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          status: 'confirmed',
          deletedAt: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      totalItems: 1,
      totalPages: 1,
      page: 1,
      perPage: 10,
    },
    error: null,
    isLoading: false,
  }),
  useAdminDocumentDownloadUrl: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useHardDeleteDocument: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useRestoreDocument: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useSoftDeleteDocument: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

// Mock the upload modal to avoid Uppy initialization
vi.mock('./admin-upload-modal', () => ({
  AdminUploadModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="upload-modal">Upload Modal</div> : null,
}));

describe('DocumentsDashboard', () => {
  it('returns null when session is not authenticated', () => {
    const { queryByText } = render(<DocumentsDashboard session={null} />);
    expect(queryByText('Documents Management')).not.toBeInTheDocument();
    expect(queryByText('Upload')).not.toBeInTheDocument();
  });

  it('returns null when session.isAuthenticated is false', () => {
    const { queryByText } = render(
      <DocumentsDashboard session={{ isAuthenticated: false, userId: 'u1' }} />,
    );
    expect(queryByText('Documents Management')).not.toBeInTheDocument();
    expect(queryByText('Upload')).not.toBeInTheDocument();
  });

  it('renders the documents table when authenticated', () => {
    const { getByText } = render(
      <DocumentsDashboard session={{ isAuthenticated: true, userId: 'u1' }} />,
    );

    expect(getByText('Documents Management')).toBeInTheDocument();
    expect(getByText('report.pdf')).toBeInTheDocument();
  });

  it('renders the show deleted switch', () => {
    const { getByText } = render(
      <DocumentsDashboard session={{ isAuthenticated: true, userId: 'u1' }} />,
    );

    expect(getByText('Show deleted')).toBeInTheDocument();
  });

  it('renders the upload button', () => {
    const { getByText } = render(
      <DocumentsDashboard session={{ isAuthenticated: true, userId: 'u1' }} />,
    );

    expect(getByText('Upload')).toBeInTheDocument();
  });

  it('opens upload modal when upload button is clicked', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const user = userEvent.setup();

    const { getByText, getByTestId } = render(
      <DocumentsDashboard session={{ isAuthenticated: true, userId: 'u1' }} />,
    );

    await user.click(getByText('Upload'));
    expect(getByTestId('upload-modal')).toBeInTheDocument();
  });
});
