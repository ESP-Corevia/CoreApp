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
});
