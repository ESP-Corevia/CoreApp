import { relations } from 'drizzle-orm';
import { index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { users } from './auth';

/** Document upload status. */
export const documentStatusEnum = pgEnum('document_status', ['pending', 'confirmed']);

/**
 * Patient documents: medical files uploaded by patients and stored in S3/MinIO.
 * Relation N:1 with `users` via `userId`.
 */
export const documents = pgTable(
  'documents',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    userId: t
      .uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileName: t.text('file_name').notNull(),
    fileKey: t.text('file_key').notNull().unique(),
    mimeType: t.text('mime_type').notNull(),
    fileSize: t.integer('file_size').notNull(),
    status: documentStatusEnum('status').notNull().default('pending'),
    deletedAt: t.timestamp('deleted_at', { mode: 'date' }),
    createdAt: t.timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: t.timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  }),
  table => [
    index('documents_user_id_idx').on(table.userId),
    index('documents_status_idx').on(table.status),
  ],
);

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));
