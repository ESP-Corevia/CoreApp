import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db as DB } from '../index';

import type * as schema from '../schema';
import { doctors, doctorUsersView, users } from '../schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export interface ListBookableParams {
  specialty?: string;
  city?: string;
  search?: string;
  offset: number;
  limit: number;
}

export interface ListAllAdminParams {
  specialty?: string;
  city?: string;
  search?: string;
  offset: number;
  limit: number;
}

function buildAdminFilters(params: ListAllAdminParams) {
  const conditions = [];

  if (params.specialty) {
    conditions.push(eq(doctorUsersView.specialty, params.specialty));
  }

  if (params.city) {
    conditions.push(ilike(doctorUsersView.city, params.city));
  }

  if (params.search) {
    const pattern = `%${params.search}%`;
    conditions.push(
      or(
        ilike(doctorUsersView.name, pattern),
        ilike(doctorUsersView.email, pattern),
        ilike(doctorUsersView.specialty, pattern),
        ilike(doctorUsersView.city, pattern),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function buildFilters(params: ListBookableParams) {
  const conditions = [];

  if (params.specialty) {
    conditions.push(eq(doctorUsersView.specialty, params.specialty));
  }

  if (params.city) {
    conditions.push(ilike(doctorUsersView.city, params.city));
  }

  if (params.search) {
    const pattern = `%${params.search}%`;
    conditions.push(
      or(
        ilike(doctorUsersView.specialty, pattern),
        ilike(doctorUsersView.doctorAddress, pattern),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export const createDoctorsRepo = (db: DrizzleDB = DB) => ({
  listBookable: async (params: ListBookableParams) => {
    const where = buildFilters(params);

    return await db
      .select({
        id: doctorUsersView.doctorId,
        userId: doctorUsersView.userId,
        specialty: doctorUsersView.specialty,
        address: doctorUsersView.doctorAddress,
        name: doctorUsersView.name,
        city: doctorUsersView.city,
      })
      .from(doctorUsersView)
      .where(where)
      .orderBy(asc(doctorUsersView.specialty))
      .limit(params.limit)
      .offset(params.offset);
  },

  getByUserId: async (userId: string) => {
    const [row] = await db
      .select({
        specialty: doctorUsersView.specialty,
        address: doctorUsersView.doctorAddress,
        city: doctorUsersView.city,
      })
      .from(doctorUsersView)
      .where(eq(doctorUsersView.userId, userId))
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
    return db.transaction(async tx => {
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
      .from(doctorUsersView)
      .where(where);

    return Number(row.count);
  },

  listAllAdmin: async (params: ListAllAdminParams) => {
    const where = buildAdminFilters(params);

    return await db
      .select({
        id: doctorUsersView.doctorId,
        userId: doctorUsersView.userId,
        specialty: doctorUsersView.specialty,
        address: doctorUsersView.doctorAddress,
        city: doctorUsersView.city,
        name: doctorUsersView.name,
        email: doctorUsersView.email,
        image: doctorUsersView.image,
      })
      .from(doctorUsersView)
      .where(where)
      .orderBy(asc(doctorUsersView.name))
      .limit(params.limit)
      .offset(params.offset);
  },

  countAllAdmin: async (params: Omit<ListAllAdminParams, 'offset' | 'limit'>) => {
    const where = buildAdminFilters({ ...params, offset: 0, limit: 0 });

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(doctorUsersView)
      .where(where);

    return Number(row.count);
  },
});
