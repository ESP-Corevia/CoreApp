import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import { authMock, createTestCaller, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

const DOC_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const fakeAdminDocument = {
  id: DOC_UUID,
  userId: 'b1ffcd00-1a2b-4ef8-bb6d-6bb9bd380a22',
  userName: 'Jane Doe',
  userEmail: 'jane@example.com',
  fileName: 'report.pdf',
  fileKey: 'users/b1ffcd00-1a2b-4ef8-bb6d-6bb9bd380a22/report.pdf',
  mimeType: 'application/pdf',
  fileSize: 2048,
  status: 'confirmed' as const,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('adminDocumentsRouter', () => {
  describe('adminListDocuments', () => {
    beforeEach(() => {
      mockServices.documentsService.adminList.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    });

    it('rejects unauthenticated requests', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.admin.adminListDocuments({ page: 1, perPage: 10 })).rejects.toThrow(
        'Authentication required',
      );
    });

    it('rejects non-admin users', async () => {
      authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.admin.adminListDocuments({ page: 1, perPage: 10 })).rejects.toThrow(
        'You must be an admin to access this resource',
      );
    });

    it('calls service with correct params and returns paginated result', async () => {
      const mockResponse = {
        documents: [fakeAdminDocument],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        perPage: 10,
      };

      mockServices.documentsService.adminList.mockResolvedValue(mockResponse);

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.admin.adminListDocuments({
        page: 1,
        perPage: 10,
        search: 'jane',
        includeDeleted: false,
      });

      expect(mockServices.documentsService.adminList).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        search: 'jane',
        includeDeleted: false,
      });
      expect(result).toEqual(mockResponse);
    });

    it('works with minimal input (no search, includeDeleted defaults to false)', async () => {
      const mockResponse = {
        documents: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        perPage: 10,
      };

      mockServices.documentsService.adminList.mockResolvedValue(mockResponse);

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.admin.adminListDocuments({ page: 1, perPage: 10 });

      expect(result).toEqual(mockResponse);
      expect(mockServices.documentsService.adminList).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        search: undefined,
        includeDeleted: false,
      });
    });

    it('rejects perPage above the admin max', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.admin.adminListDocuments({ page: 1, perPage: 101 })).rejects.toThrow();
      expect(mockServices.documentsService.adminList).not.toHaveBeenCalled();
    });
  });

  describe('adminRestoreDocument', () => {
    beforeEach(() => {
      mockServices.documentsService.adminRestore.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    });

    it('rejects non-admin users', async () => {
      authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.admin.adminRestoreDocument({ documentId: DOC_UUID })).rejects.toThrow(
        'You must be an admin to access this resource',
      );
    });

    it('calls service and returns restored document', async () => {
      const restoredDoc = { ...fakeAdminDocument, deletedAt: null };
      mockServices.documentsService.adminRestore.mockResolvedValue(restoredDoc);

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.admin.adminRestoreDocument({ documentId: DOC_UUID });

      expect(mockServices.documentsService.adminRestore).toHaveBeenCalledWith(DOC_UUID);
      expect(result.id).toBe(DOC_UUID);
      expect(result.deletedAt).toBeNull();
    });

    it('propagates NOT_FOUND when document does not exist', async () => {
      mockServices.documentsService.adminRestore.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.admin.adminRestoreDocument({ documentId: DOC_UUID })).rejects.toThrow(
        'Document not found',
      );
    });

    it('rejects invalid UUID for documentId', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.admin.adminRestoreDocument({ documentId: 'not-a-uuid' }),
      ).rejects.toThrow();
    });
  });

  describe('adminHardDeleteDocument', () => {
    beforeEach(() => {
      mockServices.documentsService.adminHardDelete.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    });

    it('rejects non-admin users', async () => {
      authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.admin.adminHardDeleteDocument({ documentId: DOC_UUID })).rejects.toThrow(
        'You must be an admin to access this resource',
      );
    });

    it('calls service and returns document id', async () => {
      mockServices.documentsService.adminHardDelete.mockResolvedValue({ id: DOC_UUID });

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.admin.adminHardDeleteDocument({ documentId: DOC_UUID });

      expect(mockServices.documentsService.adminHardDelete).toHaveBeenCalledWith(DOC_UUID);
      expect(result).toEqual({ id: DOC_UUID });
    });

    it('propagates NOT_FOUND when document does not exist', async () => {
      mockServices.documentsService.adminHardDelete.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.admin.adminHardDeleteDocument({ documentId: DOC_UUID })).rejects.toThrow(
        'Document not found',
      );
    });

    it('rejects invalid UUID for documentId', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.admin.adminHardDeleteDocument({ documentId: 'not-a-uuid' }),
      ).rejects.toThrow();
    });
  });

  describe('adminSoftDeleteDocument', () => {
    beforeEach(() => {
      mockServices.documentsService.adminSoftDelete.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    });

    it('rejects non-admin users', async () => {
      authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.admin.adminSoftDeleteDocument({ documentId: DOC_UUID })).rejects.toThrow(
        'You must be an admin to access this resource',
      );
    });

    it('calls service and returns soft-deleted document', async () => {
      const deletedDoc = { ...fakeAdminDocument, deletedAt: new Date() };
      mockServices.documentsService.adminSoftDelete.mockResolvedValue(deletedDoc);

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.admin.adminSoftDeleteDocument({ documentId: DOC_UUID });

      expect(mockServices.documentsService.adminSoftDelete).toHaveBeenCalledWith(DOC_UUID);
      expect(result.id).toBe(DOC_UUID);
      expect(result.deletedAt).toBeDefined();
    });

    it('propagates BAD_REQUEST when document is already deleted', async () => {
      mockServices.documentsService.adminSoftDelete.mockRejectedValue(
        new TRPCError({ code: 'BAD_REQUEST', message: 'Document is already deleted' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.admin.adminSoftDeleteDocument({ documentId: DOC_UUID })).rejects.toThrow(
        'Document is already deleted',
      );
    });

    it('rejects invalid UUID for documentId', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.admin.adminSoftDeleteDocument({ documentId: 'not-a-uuid' }),
      ).rejects.toThrow();
    });
  });

  describe('adminGetDocumentDownloadUrl', () => {
    beforeEach(() => {
      mockServices.documentsService.adminGetDownloadUrl.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    });

    it('rejects non-admin users', async () => {
      authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.admin.adminGetDocumentDownloadUrl({ documentId: DOC_UUID }),
      ).rejects.toThrow('You must be an admin to access this resource');
    });

    it('calls service and returns url, fileName, and mimeType', async () => {
      mockServices.documentsService.adminGetDownloadUrl.mockResolvedValue({
        downloadUrl: 'https://storage.example.com/presigned/report.pdf',
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
      });

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.admin.adminGetDocumentDownloadUrl({ documentId: DOC_UUID });

      expect(mockServices.documentsService.adminGetDownloadUrl).toHaveBeenCalledWith(DOC_UUID);
      expect(result.downloadUrl).toBe('https://storage.example.com/presigned/report.pdf');
      expect(result.fileName).toBe('report.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('propagates NOT_FOUND when document does not exist', async () => {
      mockServices.documentsService.adminGetDownloadUrl.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.admin.adminGetDocumentDownloadUrl({ documentId: DOC_UUID }),
      ).rejects.toThrow('Document not found');
    });

    it('rejects invalid UUID for documentId', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.admin.adminGetDocumentDownloadUrl({ documentId: 'not-a-uuid' }),
      ).rejects.toThrow();
    });
  });
});
