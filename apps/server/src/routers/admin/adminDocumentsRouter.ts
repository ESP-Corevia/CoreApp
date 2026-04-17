import { z } from 'zod';

import {
  AdminDocumentListOutputSchema,
  DocumentWithDeletedAtOutputSchema,
  DownloadUrlOutputSchema,
  RequestUploadInputSchema,
  RequestUploadOutputSchema,
} from '../../db/services/documents.service';
import { adminProcedure } from '../../middlewares';
import { MAX_ADMIN_PER_PAGE } from './constants';

export const adminListDocuments = adminProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/admin/documents',
      summary: 'List all documents',
      description:
        'Returns a paginated list of all documents with user info. Supports search by user name/email and includeDeleted filter.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      page: z.number().int().positive(),
      perPage: z.number().int().positive().max(MAX_ADMIN_PER_PAGE),
      search: z.string().optional(),
      includeDeleted: z.boolean().optional().default(false),
    }),
  )
  .output(AdminDocumentListOutputSchema)
  .query(async ({ input, ctx }) => {
    return await ctx.services.documentsService.adminList({
      page: input.page,
      perPage: input.perPage,
      search: input.search,
      includeDeleted: input.includeDeleted,
    });
  });

export const adminRestoreDocument = adminProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/admin/documents/{documentId}/restore',
      summary: 'Restore a soft-deleted document',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(z.object({ documentId: z.uuid() }))
  .output(DocumentWithDeletedAtOutputSchema)
  .mutation(async ({ input, ctx }) => {
    return await ctx.services.documentsService.adminRestore(input.documentId);
  });

export const adminHardDeleteDocument = adminProcedure
  .meta({
    openapi: {
      method: 'DELETE',
      path: '/admin/documents/{documentId}/hard',
      summary: 'Permanently delete a document and its S3 object',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(z.object({ documentId: z.uuid() }))
  .output(z.object({ id: z.uuid() }))
  .mutation(async ({ input, ctx }) => {
    return await ctx.services.documentsService.adminHardDelete(input.documentId);
  });

export const adminSoftDeleteDocument = adminProcedure
  .meta({
    openapi: {
      method: 'DELETE',
      path: '/admin/documents/{documentId}',
      summary: 'Soft-delete a document',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(z.object({ documentId: z.uuid() }))
  .output(DocumentWithDeletedAtOutputSchema)
  .mutation(async ({ input, ctx }) => {
    return await ctx.services.documentsService.adminSoftDelete(input.documentId);
  });

export const adminRequestUpload = adminProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/admin/documents/upload',
      summary: 'Request upload URL on behalf of a user',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(RequestUploadInputSchema.extend({ userId: z.uuid() }))
  .output(RequestUploadOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { userId, ...uploadInput } = input;
    return await ctx.services.documentsService.requestUpload(userId, uploadInput);
  });

export const adminConfirmUpload = adminProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/admin/documents/{documentId}/confirm',
      summary: 'Confirm an admin-initiated upload',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(z.object({ documentId: z.uuid() }))
  .output(DocumentWithDeletedAtOutputSchema)
  .mutation(async ({ input, ctx }) => {
    return await ctx.services.documentsService.adminConfirmUpload(input.documentId);
  });

export const adminGetDocumentDownloadUrl = adminProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/admin/documents/{documentId}/download',
      summary: 'Get download URL for any document (including soft-deleted)',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(z.object({ documentId: z.uuid() }))
  .output(DownloadUrlOutputSchema)
  .query(async ({ input, ctx }) => {
    return await ctx.services.documentsService.adminGetDownloadUrl(input.documentId);
  });
