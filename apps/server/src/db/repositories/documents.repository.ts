import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { db as DB } from '../index';
import type * as schema from '../schema';
import { documents } from '../schema';
import { users } from '../schema/auth';

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

  findByIdIncludeDeleted: async (id: string): Promise<Document | null> => {
    const [row] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return row ?? null;
  },

  findAll: async (params: {
    search?: string;
    includeDeleted: boolean;
    offset: number;
    limit: number;
  }) => {
    const conditions = [];

    if (!params.includeDeleted) {
      conditions.push(isNull(documents.deletedAt));
    }

    if (params.search) {
      const pattern = `%${params.search}%`;
      conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select({
        id: documents.id,
        userId: documents.userId,
        userName: users.name,
        userEmail: users.email,
        fileName: documents.fileName,
        fileKey: documents.fileKey,
        mimeType: documents.mimeType,
        fileSize: documents.fileSize,
        status: documents.status,
        deletedAt: documents.deletedAt,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .innerJoin(users, eq(documents.userId, users.id))
      .where(where)
      .orderBy(desc(documents.createdAt))
      .limit(params.limit)
      .offset(params.offset);
  },

  countAll: async (params: { search?: string; includeDeleted: boolean }): Promise<number> => {
    const conditions = [];

    if (!params.includeDeleted) {
      conditions.push(isNull(documents.deletedAt));
    }

    if (params.search) {
      const pattern = `%${params.search}%`;
      conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .innerJoin(users, eq(documents.userId, users.id))
      .where(where);

    return result?.count ?? 0;
  },

  restore: async (id: string): Promise<Document> => {
    const [row] = await db
      .update(documents)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return row;
  },

  hardDelete: async (id: string): Promise<void> => {
    await db.delete(documents).where(eq(documents.id, id));
  },
});
