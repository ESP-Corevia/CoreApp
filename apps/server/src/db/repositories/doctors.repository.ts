import { and, ilike, eq, sql, asc } from 'drizzle-orm';

import { db as DB } from '../index';
import { doctors, users } from '../schema';

import type * as schema from '../schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export interface ListBookableParams {
  specialty?: string;
  city?: string;
  search?: string;
  offset: number;
  limit: number;
}

function buildFilters(params: ListBookableParams) {
  const conditions = [];

  if (params.specialty) {
    conditions.push(eq(doctors.specialty, params.specialty));
  }

  if (params.city) {
    conditions.push(ilike(doctors.city, params.city));
  }

  if (params.search) {
    const pattern = `%${params.search}%`;
    conditions.push(
      sql`(${ilike(doctors.specialty, pattern)} OR ${ilike(doctors.address, pattern)})`,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export const createDoctorsRepo = (db: DrizzleDB = DB) => ({
  listBookable: async (params: ListBookableParams) => {
    const where = buildFilters(params);

    return await db
      .select({
        id: doctors.id,
        userId: doctors.userId,
        specialty: doctors.specialty,
        address: doctors.address,
        name: users.name,
        city: doctors.city,
      })
      .from(doctors)
      .where(where)
      .orderBy(asc(doctors.specialty))
      .leftJoin(users, eq(doctors.userId, users.id))
      .limit(params.limit)
      .offset(params.offset);
  },

  getByUserId: async (userId: string) => {
    const [row] = await db
      .select({
        specialty: doctors.specialty,
        address: doctors.address,
        city: doctors.city,
      })
      .from(doctors)
      .where(eq(doctors.userId, userId))
      .limit(1);

    return row ?? null;
  },

  updateByUserId: (
    userId: string,
    data: Partial<{
      specialty: string;
      address: string;
      city: string;
      imageUrl: string | null;
    }>,
  ) => {
    return db.transaction(async (tx) => {
      const [doctor] = await tx
        .update(doctors)
        .set(data)
        .where(eq(doctors.userId, userId))
        .returning();

      await tx.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId));

      return doctor ?? null;
    });
  },

  countBookable: async (params: Omit<ListBookableParams, 'offset' | 'limit'>) => {
    const where = buildFilters({ ...params, offset: 0, limit: 0 });

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(doctors)
      .where(where);

    return Number(row.count);
  },
});
