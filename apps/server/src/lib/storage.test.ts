import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createStorageService } from './storage';

/**
 * The S3 client is injected, so every command sent to object storage is asserted here without a
 * running MinIO. Presigned URLs are generated with the real client because signing is a pure
 * cryptographic operation.
 */
const send = vi.fn();
const fakeClient = { send } as unknown as S3Client;

beforeEach(() => {
  send.mockReset();
});

describe('storage.ensureBucket', () => {
  it('does not create the bucket when it already exists', async () => {
    send.mockResolvedValue({});

    await createStorageService(fakeClient).ensureBucket();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
  });

  it('creates the bucket when the head request fails', async () => {
    send.mockRejectedValueOnce(new Error('NotFound')).mockResolvedValueOnce({});

    await createStorageService(fakeClient).ensureBucket();

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
  });

  it('propagates a failure to create the bucket', async () => {
    send.mockRejectedValue(new Error('access denied'));

    await expect(createStorageService(fakeClient).ensureBucket()).rejects.toThrow('access denied');
  });
});

describe('storage.objectExists', () => {
  it('returns true when the object head request succeeds', async () => {
    send.mockResolvedValue({});

    await expect(createStorageService(fakeClient).objectExists('users/1/a.pdf')).resolves.toBe(
      true,
    );
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
  });

  it('returns false when the object is missing', async () => {
    send.mockRejectedValue(new Error('NotFound'));

    await expect(
      createStorageService(fakeClient).objectExists('users/1/missing.pdf'),
    ).resolves.toBe(false);
  });
});

describe('storage.deleteObject', () => {
  it('sends a delete command for the requested key', async () => {
    send.mockResolvedValue({});

    await createStorageService(fakeClient).deleteObject('users/1/a.pdf');

    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect((command as DeleteObjectCommand).input.Key).toBe('users/1/a.pdf');
  });

  it('propagates a storage failure', async () => {
    send.mockRejectedValue(new Error('bucket unavailable'));

    await expect(createStorageService(fakeClient).deleteObject('users/1/a.pdf')).rejects.toThrow(
      'bucket unavailable',
    );
  });
});

describe('storage presigned urls', () => {
  it('signs an upload url for the given key and content type', async () => {
    const url = await createStorageService().generateUploadUrl(
      'users/1/report.pdf',
      'application/pdf',
      1024,
    );

    const parsed = new URL(url);
    expect(parsed.pathname).toContain('users/1/report.pdf');
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe('900');
    expect(parsed.searchParams.get('X-Amz-Signature')).toBeTruthy();
    expect(parsed.searchParams.get('X-Amz-SignedHeaders')).toContain('content-type');
  });

  it('signs a download url for the given key', async () => {
    const url = await createStorageService().generateDownloadUrl('users/1/report.pdf');

    const parsed = new URL(url);
    expect(parsed.pathname).toContain('users/1/report.pdf');
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe('900');
    expect(parsed.searchParams.get('X-Amz-Signature')).toBeTruthy();
  });

  it('produces different signatures for different keys', async () => {
    const storage = createStorageService();

    const [first, second] = await Promise.all([
      storage.generateDownloadUrl('users/1/a.pdf'),
      storage.generateDownloadUrl('users/1/b.pdf'),
    ]);

    expect(new URL(first).searchParams.get('X-Amz-Signature')).not.toBe(
      new URL(second).searchParams.get('X-Amz-Signature'),
    );
  });
});
