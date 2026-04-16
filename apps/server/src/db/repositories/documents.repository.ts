import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { db as DB } from '../index';
import type * as schema from '../schema';
import { documents } from '../schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export type Document = InferSelectModel<typeof documents>;
export type DocumentInsert = InferInsertModel<typeof documents>;

export const createDocumentsRepo = (db: DrizzleDB = DB) => ({
  create: async (
    data: Omit<DocumentInsert, 'id' | 'status' | 'deletedAt' | 'createdAt' | 'updatedAt'>,
  ): Promise<Document> => {
    const [row] = await db.insert(documents).values(data).returning();
    return row;
  },

  findById: async (id: string): Promise<Document | null> => {
    const [row] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  findByUserId: async (userId: string): Promise<Document[]> => {
    return db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          isNull(documents.deletedAt),
          eq(documents.status, 'confirmed'),
        ),
      );
  },

  confirmUpload: async (id: string): Promise<Document> => {
    const [row] = await db
      .update(documents)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
      .returning();
    return row;
  },

  softDelete: async (id: string): Promise<Document> => {
    const [row] = await db
      .update(documents)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
      .returning();
    return row;
  },
});
