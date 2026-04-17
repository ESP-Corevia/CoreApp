import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import type { FileEntry } from '../hooks/use-admin-upload';
import { UploadFileItem } from './upload-file-item';

const makeFile = (overrides: Partial<FileEntry> = {}): FileEntry => ({
  id: 'file-1',
  name: 'document.pdf',
  size: 1024,
  progress: 0,
  status: 'pending',
  ...overrides,
});

describe('UploadFileItem', () => {
  it('renders file name and size', () => {
    const { getByText } = render(<UploadFileItem file={makeFile()} onRemove={vi.fn()} />);

    expect(getByText('document.pdf')).toBeInTheDocument();
    expect(getByText('1.0 KB')).toBeInTheDocument();
  });

  it('formats bytes correctly', () => {
    const { getByText } = render(
      <UploadFileItem file={makeFile({ size: 500 })} onRemove={vi.fn()} />,
    );
    expect(getByText('500 B')).toBeInTheDocument();
  });

  it('formats MB correctly', () => {
    const { getByText } = render(
      <UploadFileItem file={makeFile({ size: 2 * 1024 * 1024 })} onRemove={vi.fn()} />,
    );
    expect(getByText('2.0 MB')).toBeInTheDocument();
  });

  it('shows remove button for pending files', () => {
    const onRemove = vi.fn();
    const { getByRole } = render(
      <UploadFileItem file={makeFile({ status: 'pending' })} onRemove={onRemove} />,
    );

    const btn = getByRole('button');
    btn.click();
    expect(onRemove).toHaveBeenCalledWith('file-1');
  });

  it('shows progress bar for uploading files', () => {
    const { container } = render(
      <UploadFileItem file={makeFile({ status: 'uploading', progress: 50 })} onRemove={vi.fn()} />,
    );

    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toBeInTheDocument();
  });

  it('shows check icon for confirmed files', () => {
    const { container } = render(
      <UploadFileItem file={makeFile({ status: 'confirmed', progress: 100 })} onRemove={vi.fn()} />,
    );

    // Check icon has text-green-500 class
    const checkIcon = container.querySelector('.text-green-500');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows error message for failed files', () => {
    const { getByText, container } = render(
      <UploadFileItem
        file={makeFile({ status: 'error', error: 'Network failure' })}
        onRemove={vi.fn()}
      />,
    );

    expect(getByText('Network failure')).toBeInTheDocument();
    // X icon with text-destructive
    const errorIcon = container.querySelector('.text-destructive');
    expect(errorIcon).toBeInTheDocument();
  });

  it('does not show remove button for non-pending files', () => {
    const { queryByRole } = render(
      <UploadFileItem file={makeFile({ status: 'uploading' })} onRemove={vi.fn()} />,
    );

    expect(queryByRole('button')).not.toBeInTheDocument();
  });
});
