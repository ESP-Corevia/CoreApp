import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import { AdminUploadModal } from './admin-upload-modal';

const _VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

// Mock the useAdminUpload hook
const mockUpload = {
  userId: '',
  setUserId: vi.fn(),
  files: [] as { id: string; name: string; size: number; progress: number; status: string }[],
  overallProgress: 0,
  isUploading: false,
  isValidUuid: false,
  canUpload: false,
  pendingCount: 0,
  fileInputRef: { current: null },
  addFiles: vi.fn(),
  removeFile: vi.fn(),
  startUpload: vi.fn(),
  reset: vi.fn(),
};

vi.mock('../hooks/use-admin-upload', () => ({
  ALLOWED_MIME_TYPES: ['application/pdf'],
  useAdminUpload: () => mockUpload,
}));

describe('AdminUploadModal', () => {
  it('renders dialog title and description when open', () => {
    const { getByText } = render(<AdminUploadModal open={true} onOpenChange={vi.fn()} />);

    expect(getByText('Upload Documents')).toBeInTheDocument();
    expect(
      getByText('Upload files on behalf of a user. Enter their user ID and select files.'),
    ).toBeInTheDocument();
  });

  it('renders user ID input and select files button', () => {
    const { getByPlaceholderText, getByText } = render(
      <AdminUploadModal open={true} onOpenChange={vi.fn()} />,
    );

    expect(getByPlaceholderText('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')).toBeInTheDocument();
    expect(getByText('Select Files')).toBeInTheDocument();
  });

  it('shows invalid UUID message when userId is set but invalid', () => {
    mockUpload.userId = 'not-a-uuid';
    mockUpload.isValidUuid = false;

    const { getByText } = render(<AdminUploadModal open={true} onOpenChange={vi.fn()} />);

    expect(getByText('Please enter a valid UUID')).toBeInTheDocument();

    // Reset
    mockUpload.userId = '';
    mockUpload.isValidUuid = false;
  });

  it('does not show invalid UUID message when userId is empty', () => {
    mockUpload.userId = '';

    const { queryByText } = render(<AdminUploadModal open={true} onOpenChange={vi.fn()} />);

    expect(queryByText('Please enter a valid UUID')).not.toBeInTheDocument();
  });

  it('disables select files button when UUID is invalid', () => {
    mockUpload.isValidUuid = false;

    const { getByText } = render(<AdminUploadModal open={true} onOpenChange={vi.fn()} />);

    expect(getByText('Select Files').closest('button')).toBeDisabled();

    mockUpload.isValidUuid = true;
  });

  it('disables upload button when canUpload is false', () => {
    mockUpload.canUpload = false;
    mockUpload.pendingCount = 0;

    const { getByText } = render(<AdminUploadModal open={true} onOpenChange={vi.fn()} />);

    expect(getByText(/Upload 0 file/).closest('button')).toBeDisabled();
  });

  it('shows uploading state with spinner and progress', () => {
    mockUpload.isUploading = true;
    mockUpload.overallProgress = 45;
    mockUpload.canUpload = false;

    const { getByText, getAllByText } = render(
      <AdminUploadModal open={true} onOpenChange={vi.fn()} />,
    );

    // Overall progress text
    expect(getByText('45%')).toBeInTheDocument();
    // "Uploading..." appears in both the progress section and the button
    expect(getAllByText('Uploading...').length).toBeGreaterThanOrEqual(1);

    // Reset
    mockUpload.isUploading = false;
    mockUpload.overallProgress = 0;
  });

  it('renders file items when files are present', () => {
    mockUpload.files = [
      { id: 'f1', name: 'test.pdf', size: 1024, progress: 0, status: 'pending' },
      { id: 'f2', name: 'photo.png', size: 2048, progress: 50, status: 'uploading' },
    ];

    const { getByText } = render(<AdminUploadModal open={true} onOpenChange={vi.fn()} />);

    expect(getByText('test.pdf')).toBeInTheDocument();
    expect(getByText('photo.png')).toBeInTheDocument();

    mockUpload.files = [];
  });

  it('calls reset and onOpenChange when cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    mockUpload.isUploading = false;

    const userEvent = (await import('@testing-library/user-event')).default;
    const user = userEvent.setup();

    const { getByText } = render(<AdminUploadModal open={true} onOpenChange={onOpenChange} />);

    await user.click(getByText('Cancel'));

    expect(mockUpload.reset).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when uploading', async () => {
    const onOpenChange = vi.fn();
    mockUpload.isUploading = true;
    mockUpload.canUpload = false;

    const userEvent = (await import('@testing-library/user-event')).default;
    const user = userEvent.setup();

    const { getByText } = render(<AdminUploadModal open={true} onOpenChange={onOpenChange} />);

    await user.click(getByText('Cancel'));

    expect(onOpenChange).not.toHaveBeenCalled();

    mockUpload.isUploading = false;
  });
});
