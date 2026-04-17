import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { StorageService } from '../../lib/storage';
import type { createDocumentsRepo } from '../repositories/documents.repository';
import { createDocumentsService } from './documents.service';

const mockDocumentsRepo = mockDeep<ReturnType<typeof createDocumentsRepo>>();
const mockStorage = mockDeep<StorageService>();

const service = createDocumentsService(mockDocumentsRepo, mockStorage);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('documentsService', () => {
  describe('requestUpload', () => {
    it('creates document and returns presigned URL', async () => {
      mockDocumentsRepo.create.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'pending',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockStorage.generateUploadUrl.mockResolvedValue('https://minio.local/presigned-put');

      const result = await service.requestUpload('user-1', {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      });

      expect(result.uploadUrl).toBe('https://minio.local/presigned-put');
      expect(result.documentId).toBe('doc-1');
      expect(mockDocumentsRepo.create).toHaveBeenCalledOnce();
    });
  });

  describe('confirmUpload', () => {
    it('throws if document not found', async () => {
      mockDocumentsRepo.findById.mockResolvedValue(null);

      await expect(service.confirmUpload('user-1', 'doc-1')).rejects.toThrow('not found');
    });

    it('throws if document belongs to another user', async () => {
      mockDocumentsRepo.findById.mockResolvedValue({
        id: 'doc-1',
        userId: 'other-user',
        fileName: 'test.pdf',
        fileKey: 'users/other-user/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'pending',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.confirmUpload('user-1', 'doc-1')).rejects.toThrow('not found');
    });

    it('throws if object not in S3', async () => {
      mockDocumentsRepo.findById.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'pending',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockStorage.objectExists.mockResolvedValue(false);

      await expect(service.confirmUpload('user-1', 'doc-1')).rejects.toThrow('not been uploaded');
    });
  });

  describe('list', () => {
    it('returns own documents for patient role', async () => {
      mockDocumentsRepo.findByUserId.mockResolvedValue([]);

      const result = await service.list('user-1', 'patient');
      expect(mockDocumentsRepo.findByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([]);
    });

    it('ignores targetUserId input for patient role', async () => {
      mockDocumentsRepo.findByUserId.mockResolvedValue([]);

      await service.list('user-1', 'patient', 'other-user');
      expect(mockDocumentsRepo.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('returns documents by targetUserId for doctor role', async () => {
      mockDocumentsRepo.findByUserId.mockResolvedValue([]);

      const result = await service.list('doc-1', 'doctor', 'user-1');
      expect(mockDocumentsRepo.findByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([]);
    });

    it('returns empty array for doctor with no targetUserId', async () => {
      const result = await service.list('doc-1', 'doctor');
      expect(result).toEqual([]);
    });
  });

  describe('getDownloadUrl', () => {
    it('generates a presigned download URL for doctor', async () => {
      mockDocumentsRepo.findById.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockStorage.generateDownloadUrl.mockResolvedValue('https://minio.local/presigned-get');

      const result = await service.getDownloadUrl('doc-1', 'doctor', 'doc-1');
      expect(result.downloadUrl).toBe('https://minio.local/presigned-get');
      expect(result.fileName).toBe('test.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('allows patient to download own document', async () => {
      mockDocumentsRepo.findById.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockStorage.generateDownloadUrl.mockResolvedValue('https://minio.local/presigned-get');

      const result = await service.getDownloadUrl('user-1', 'patient', 'doc-1');
      expect(result.downloadUrl).toBe('https://minio.local/presigned-get');
    });

    it('rejects patient downloading another users document', async () => {
      mockDocumentsRepo.findById.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.getDownloadUrl('user-2', 'patient', 'doc-1')).rejects.toThrow(
        'not found',
      );
    });
  });

  describe('delete', () => {
    it('soft-deletes own document', async () => {
      mockDocumentsRepo.findById.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockDocumentsRepo.softDelete.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.delete('user-1', 'doc-1');
      expect(result?.deletedAt).toBeDefined();
    });

    it('rejects deleting another users document', async () => {
      mockDocumentsRepo.findById.mockResolvedValue({
        id: 'doc-1',
        userId: 'other-user',
        fileName: 'test.pdf',
        fileKey: 'users/other-user/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.delete('user-1', 'doc-1')).rejects.toThrow('not found');
    });
  });

  describe('adminList', () => {
    it('calls findAll and countAll with correct params and returns paginated result', async () => {
      const fakeDoc = {
        id: 'doc-1',
        userId: 'user-1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed' as const,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDocumentsRepo.findAll.mockResolvedValue([fakeDoc]);
      mockDocumentsRepo.countAll.mockResolvedValue(1);

      const result = await service.adminList({ page: 1, perPage: 10, search: 'john', includeDeleted: false });

      expect(mockDocumentsRepo.findAll).toHaveBeenCalledWith({
        search: 'john',
        includeDeleted: false,
        offset: 0,
        limit: 10,
      });
      expect(mockDocumentsRepo.countAll).toHaveBeenCalledWith({
        search: 'john',
        includeDeleted: false,
      });
      expect(result.documents).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
    });

    it('computes correct offset for page 2', async () => {
      mockDocumentsRepo.findAll.mockResolvedValue([]);
      mockDocumentsRepo.countAll.mockResolvedValue(25);

      const result = await service.adminList({ page: 2, perPage: 10 });

      expect(mockDocumentsRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 10, limit: 10 }),
      );
      expect(result.totalPages).toBe(3);
    });
  });

  describe('adminRestore', () => {
    it('throws NOT_FOUND when document does not exist', async () => {
      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue(null);

      await expect(service.adminRestore('doc-1')).rejects.toThrow('Document not found');
    });

    it('throws BAD_REQUEST when document is not deleted', async () => {
      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.adminRestore('doc-1')).rejects.toThrow('Document is not deleted');
    });

    it('calls restore and returns result on success', async () => {
      const deletedDoc = {
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed' as const,
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const restoredDoc = { ...deletedDoc, deletedAt: null };

      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue(deletedDoc);
      mockDocumentsRepo.restore.mockResolvedValue(restoredDoc);

      const result = await service.adminRestore('doc-1');

      expect(mockDocumentsRepo.restore).toHaveBeenCalledWith('doc-1');
      expect(result?.deletedAt).toBeNull();
    });
  });

  describe('adminHardDelete', () => {
    it('throws NOT_FOUND when document does not exist', async () => {
      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue(null);

      await expect(service.adminHardDelete('doc-1')).rejects.toThrow('Document not found');
    });

    it('calls deleteObject and hardDelete then returns id on success', async () => {
      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockStorage.deleteObject.mockResolvedValue(undefined);
      mockDocumentsRepo.hardDelete.mockResolvedValue(undefined);

      const result = await service.adminHardDelete('doc-1');

      expect(mockStorage.deleteObject).toHaveBeenCalledWith('users/user-1/doc-1.pdf');
      expect(mockDocumentsRepo.hardDelete).toHaveBeenCalledWith('doc-1');
      expect(result).toEqual({ id: 'doc-1' });
    });
  });

  describe('adminSoftDelete', () => {
    it('throws NOT_FOUND when document does not exist', async () => {
      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue(null);

      await expect(service.adminSoftDelete('doc-1')).rejects.toThrow('Document not found');
    });

    it('throws BAD_REQUEST when document is already deleted', async () => {
      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed',
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.adminSoftDelete('doc-1')).rejects.toThrow('Document is already deleted');
    });

    it('calls softDelete and returns result on success', async () => {
      const activeDoc = {
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'test.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        status: 'confirmed' as const,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const softDeletedDoc = { ...activeDoc, deletedAt: new Date() };

      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue(activeDoc);
      mockDocumentsRepo.softDelete.mockResolvedValue(softDeletedDoc);

      const result = await service.adminSoftDelete('doc-1');

      expect(mockDocumentsRepo.softDelete).toHaveBeenCalledWith('doc-1');
      expect(result?.deletedAt).toBeDefined();
    });
  });

  describe('adminGetDownloadUrl', () => {
    it('throws NOT_FOUND when document does not exist', async () => {
      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue(null);

      await expect(service.adminGetDownloadUrl('doc-1')).rejects.toThrow('Document not found');
    });

    it('returns downloadUrl, fileName, and mimeType on success', async () => {
      mockDocumentsRepo.findByIdIncludeDeleted.mockResolvedValue({
        id: 'doc-1',
        userId: 'user-1',
        fileName: 'report.pdf',
        fileKey: 'users/user-1/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048,
        status: 'confirmed',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockStorage.generateDownloadUrl.mockResolvedValue('https://minio.local/presigned-get');

      const result = await service.adminGetDownloadUrl('doc-1');

      expect(mockStorage.generateDownloadUrl).toHaveBeenCalledWith('users/user-1/doc-1.pdf');
      expect(result.downloadUrl).toBe('https://minio.local/presigned-get');
      expect(result.fileName).toBe('report.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });
  });
});
