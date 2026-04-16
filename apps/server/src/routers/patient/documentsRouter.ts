import { z } from 'zod';

import {
  DocumentListOutputSchema,
  DocumentOutputSchema,
  DownloadUrlOutputSchema,
  RequestUploadInputSchema,
  RequestUploadOutputSchema,
} from '../../db/services/documents.service';
import { patientProcedure, protectedProcedure, router } from '../../middlewares';

export const patientDocumentsRouter = router({
  requestUpload: patientProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/documents/upload',
        summary: 'Request a document upload URL',
        description:
          'Validates file metadata and returns a presigned PUT URL for direct upload to S3/MinIO.',
        tags: ['Documents'],
      },
    })
    .input(RequestUploadInputSchema)
    .output(RequestUploadOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.documentsService.requestUpload(session.userId, input);
    }),

  confirmUpload: patientProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/documents/{documentId}/confirm',
        summary: 'Confirm a document upload',
        description: 'Verifies the file exists in S3/MinIO and marks the document as confirmed.',
        tags: ['Documents'],
      },
    })
    .input(z.object({ documentId: z.uuid() }))
    .output(DocumentOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.documentsService.confirmUpload(session.userId, input.documentId);
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/documents',
        summary: 'List documents',
        description:
          'Patients see their own documents. Doctors can pass a userId to view that user documents.',
        tags: ['Documents'],
      },
    })
    .input(z.object({ userId: z.uuid().optional() }))
    .output(DocumentListOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      return await services.documentsService.list(session.userId, session.role, input.userId);
    }),

  getDownloadUrl: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/documents/{documentId}/download',
        summary: 'Get a download URL',
        description:
          'Returns a presigned GET URL for downloading the document. Patients can only access their own documents.',
        tags: ['Documents'],
      },
    })
    .input(z.object({ documentId: z.uuid() }))
    .output(DownloadUrlOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      return await services.documentsService.getDownloadUrl(
        session.userId,
        session.role,
        input.documentId,
      );
    }),

  delete: patientProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/documents/{documentId}',
        summary: 'Delete a document',
        description: 'Soft-deletes a document. Patients can only delete their own documents.',
        tags: ['Documents'],
      },
    })
    .input(z.object({ documentId: z.uuid() }))
    .output(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx: { session, services } }) => {
      const result = await services.documentsService.delete(session.userId, input.documentId);
      return { id: result.id };
    }),
});
