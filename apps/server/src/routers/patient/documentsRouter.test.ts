import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, fakeDoctorSession, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

const DOC_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const TARGET_USER_UUID = 'b1ffcd00-1a2b-4ef8-bb6d-6bb9bd380a22';

const fakeDocument = {
  id: DOC_UUID,
  userId: TARGET_USER_UUID,
  fileName: 'test.pdf',
  mimeType: 'application/pdf',
  fileSize: 1024,
  status: 'confirmed' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  fileKey: 'documents/u_1/test.pdf',
  deletedAt: null,
};

beforeEach(() => {
  mockServices.documentsService.requestUpload.mockReset();
  mockServices.documentsService.confirmUpload.mockReset();
  mockServices.documentsService.list.mockReset();
  mockServices.documentsService.getDownloadUrl.mockReset();
  mockServices.documentsService.delete.mockReset();
});

describe('document.requestUpload', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(
      caller.document.requestUpload({
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      }),
    ).rejects.toThrow('Authentication required');
  });

  it('rejects non-patient roles', async () => {
    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await expect(
      caller.document.requestUpload({
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      }),
    ).rejects.toThrow('Patient access required');
  });

  it('calls service with userId and input', async () => {
    mockServices.documentsService.requestUpload.mockResolvedValue({
      documentId: DOC_UUID,
      uploadUrl: 'https://storage.example.com/upload/test.pdf',
    });

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.document.requestUpload({
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
    });

    expect(mockServices.documentsService.requestUpload).toHaveBeenCalledWith('u_1', {
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
    });
    expect(result.documentId).toBe(DOC_UUID);
    expect(result.uploadUrl).toBe('https://storage.example.com/upload/test.pdf');
  });

  it('rejects invalid mimeType', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(
      caller.document.requestUpload({
        fileName: 'test.exe',
        // biome-ignore lint/suspicious/noExplicitAny: pass
        mimeType: 'application/octet-stream' as any,
        fileSize: 1024,
      }),
    ).rejects.toThrow();
  });

  it('rejects fileSize exceeding 25MB', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(
      caller.document.requestUpload({
        fileName: 'big.pdf',
        mimeType: 'application/pdf',
        fileSize: 26 * 1024 * 1024,
      }),
    ).rejects.toThrow();
  });

  it('propagates NOT_FOUND when patient profile is missing', async () => {
    mockServices.documentsService.requestUpload.mockRejectedValue(
      new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' }),
    );

    const caller = createTestCaller({ customSession: fakeSession });
    await expect(
      caller.document.requestUpload({
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      }),
    ).rejects.toThrow('Patient profile not found');
  });
});

describe('document.confirmUpload', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.document.confirmUpload({ documentId: DOC_UUID })).rejects.toThrow(
      'Authentication required',
    );
  });

  it('rejects non-patient roles', async () => {
    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await expect(caller.document.confirmUpload({ documentId: DOC_UUID })).rejects.toThrow(
      'Patient access required',
    );
  });

  it('calls service with userId and documentId', async () => {
    mockServices.documentsService.confirmUpload.mockResolvedValue(fakeDocument);

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.document.confirmUpload({ documentId: DOC_UUID });

    expect(mockServices.documentsService.confirmUpload).toHaveBeenCalledWith('u_1', DOC_UUID);
    expect(result.id).toBe(DOC_UUID);
  });

  it('rejects invalid UUID for documentId', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.confirmUpload({ documentId: 'not-a-uuid' })).rejects.toThrow();
  });

  it('propagates NOT_FOUND when document does not exist', async () => {
    mockServices.documentsService.confirmUpload.mockRejectedValue(
      new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' }),
    );

    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.confirmUpload({ documentId: DOC_UUID })).rejects.toThrow(
      'Document not found',
    );
  });

  it('propagates BAD_REQUEST when file not uploaded', async () => {
    mockServices.documentsService.confirmUpload.mockRejectedValue(
      new TRPCError({ code: 'BAD_REQUEST', message: 'File has not been uploaded to storage' }),
    );

    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.confirmUpload({ documentId: DOC_UUID })).rejects.toThrow(
      'File has not been uploaded to storage',
    );
  });
});

describe('document.list', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.document.list({})).rejects.toThrow('Authentication required');
  });

  it('calls list with userId and patient role', async () => {
    mockServices.documentsService.list.mockResolvedValue([fakeDocument]);

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.document.list({});

    expect(mockServices.documentsService.list).toHaveBeenCalledWith('u_1', 'patient', undefined);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(DOC_UUID);
  });

  it('calls list with userId, doctor role, and target userId', async () => {
    mockServices.documentsService.list.mockResolvedValue([fakeDocument]);

    const caller = createTestCaller({ customSession: fakeDoctorSession });
    const result = await caller.document.list({ userId: TARGET_USER_UUID });

    expect(mockServices.documentsService.list).toHaveBeenCalledWith(
      'doc_1',
      'doctor',
      TARGET_USER_UUID,
    );
    expect(result).toHaveLength(1);
  });

  it('calls list with doctor role and no target userId', async () => {
    mockServices.documentsService.list.mockResolvedValue([]);

    const caller = createTestCaller({ customSession: fakeDoctorSession });
    const result = await caller.document.list({});

    expect(mockServices.documentsService.list).toHaveBeenCalledWith('doc_1', 'doctor', undefined);
    expect(result).toEqual([]);
  });

  it('rejects invalid userId UUID', async () => {
    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await expect(caller.document.list({ userId: 'bad-uuid' })).rejects.toThrow();
  });
});

describe('document.getDownloadUrl', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.document.getDownloadUrl({ documentId: DOC_UUID })).rejects.toThrow(
      'Authentication required',
    );
  });

  it('calls service with userId, role, and documentId', async () => {
    mockServices.documentsService.getDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://storage.example.com/download/test.pdf',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
    });

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.document.getDownloadUrl({ documentId: DOC_UUID });

    expect(mockServices.documentsService.getDownloadUrl).toHaveBeenCalledWith(
      'u_1',
      'patient',
      DOC_UUID,
    );
    expect(result.downloadUrl).toBe('https://storage.example.com/download/test.pdf');
    expect(result.fileName).toBe('test.pdf');
    expect(result.mimeType).toBe('application/pdf');
  });

  it('allows doctor to call getDownloadUrl', async () => {
    mockServices.documentsService.getDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://storage.example.com/download/test.pdf',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
    });

    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await caller.document.getDownloadUrl({ documentId: DOC_UUID });

    expect(mockServices.documentsService.getDownloadUrl).toHaveBeenCalledWith(
      'doc_1',
      'doctor',
      DOC_UUID,
    );
  });

  it('rejects invalid UUID for documentId', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.getDownloadUrl({ documentId: 'not-a-uuid' })).rejects.toThrow();
  });

  it('propagates NOT_FOUND when document does not exist', async () => {
    mockServices.documentsService.getDownloadUrl.mockRejectedValue(
      new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' }),
    );

    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.getDownloadUrl({ documentId: DOC_UUID })).rejects.toThrow(
      'Document not found',
    );
  });

  it('propagates BAD_REQUEST when upload not confirmed', async () => {
    mockServices.documentsService.getDownloadUrl.mockRejectedValue(
      new TRPCError({ code: 'BAD_REQUEST', message: 'Document upload not confirmed' }),
    );

    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.getDownloadUrl({ documentId: DOC_UUID })).rejects.toThrow(
      'Document upload not confirmed',
    );
  });
});

describe('document.delete', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.document.delete({ documentId: DOC_UUID })).rejects.toThrow(
      'Authentication required',
    );
  });

  it('rejects non-patient roles', async () => {
    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await expect(caller.document.delete({ documentId: DOC_UUID })).rejects.toThrow(
      'Patient access required',
    );
  });

  it('calls service with userId and documentId and returns id', async () => {
    mockServices.documentsService.delete.mockResolvedValue({ ...fakeDocument, id: DOC_UUID });

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.document.delete({ documentId: DOC_UUID });

    expect(mockServices.documentsService.delete).toHaveBeenCalledWith('u_1', DOC_UUID);
    expect(result.id).toBe(DOC_UUID);
  });

  it('rejects invalid UUID for documentId', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.delete({ documentId: 'not-a-uuid' })).rejects.toThrow();
  });

  it('propagates NOT_FOUND when document does not exist', async () => {
    mockServices.documentsService.delete.mockRejectedValue(
      new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' }),
    );

    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.delete({ documentId: DOC_UUID })).rejects.toThrow(
      'Document not found',
    );
  });

  it('propagates NOT_FOUND when patient profile is missing', async () => {
    mockServices.documentsService.delete.mockRejectedValue(
      new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' }),
    );

    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.document.delete({ documentId: DOC_UUID })).rejects.toThrow(
      'Patient profile not found',
    );
  });
});
