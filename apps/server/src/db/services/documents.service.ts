import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import type { StorageService } from '../../lib/storage';
import type { createDocumentsRepo } from '../repositories/documents.repository';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const RequestUploadInputSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
});

export const RequestUploadOutputSchema = z.object({
  documentId: z.uuid(),
  uploadUrl: z.url(),
});

export const DocumentOutputSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DocumentListOutputSchema = z.array(DocumentOutputSchema);

export const DownloadUrlOutputSchema = z.object({
  downloadUrl: z.url(),
  fileName: z.string(),
  mimeType: z.string(),
});

export type RequestUploadInput = z.infer<typeof RequestUploadInputSchema>;

function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? (parts.pop() ?? '') : '';
}

export const createDocumentsService = (
  documentsRepo: ReturnType<typeof createDocumentsRepo>,
  storage: StorageService,
) => ({
  requestUpload: async (userId: string, input: RequestUploadInput) => {
    const ext = getExtension(input.fileName);
    const fileKey = `users/${userId}/${crypto.randomUUID()}.${ext}`;

    const doc = await documentsRepo.create({
      userId,
      fileName: input.fileName,
      fileKey,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
    });

    const uploadUrl = await storage.generateUploadUrl(doc.fileKey, input.mimeType, input.fileSize);

    return { documentId: doc.id, uploadUrl };
  },

  confirmUpload: async (userId: string, documentId: string) => {
    const doc = await documentsRepo.findById(documentId);
    if (!doc || doc.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
    }

    const exists = await storage.objectExists(doc.fileKey);
    if (!exists) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'File has not been uploaded to storage',
      });
    }

    return documentsRepo.confirmUpload(documentId);
  },

  list: async (userId: string, role: string, targetUserId?: string) => {
    if (role === 'patient') {
      return documentsRepo.findByUserId(userId);
    }

    // Doctors and admins must provide a target user ID
    if (!targetUserId) {
      return [];
    }
    return documentsRepo.findByUserId(targetUserId);
  },

  getDownloadUrl: async (userId: string, role: string, documentId: string) => {
    const doc = await documentsRepo.findById(documentId);
    if (!doc) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
    }
    if (doc.status !== 'confirmed') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Document upload not confirmed' });
    }

    // Patients can only download their own documents
    if (role === 'patient' && doc.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
    }

    const downloadUrl = await storage.generateDownloadUrl(doc.fileKey);
    return { downloadUrl, fileName: doc.fileName, mimeType: doc.mimeType };
  },

  delete: async (userId: string, documentId: string) => {
    const doc = await documentsRepo.findById(documentId);
    if (!doc || doc.userId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
    }

    return documentsRepo.softDelete(documentId);
  },
});
