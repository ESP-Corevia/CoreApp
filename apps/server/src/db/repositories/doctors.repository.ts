import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db as DB } from '../index';

import type * as schema from '../schema';
import { doctors, doctorUsersView, users } from '../schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

const DOCTORS_USER_ID_UNIQUE_CONSTRAINT = 'doctors_user_id_unique';

export class DoctorProfileAlreadyExistsError extends Error {
  constructor() {
    super('Doctor profile already exists');
    this.name = 'DoctorProfileAlreadyExistsError';
  }
}

function isDoctorUserIdUniqueViolation(error: unknown) {
  let current: unknown = error;

  while (typeof current === 'object' && current !== null) {
    if (
      'code' in current &&
      current.code === '23505' &&
      'constraint' in current &&
      current.constraint === DOCTORS_USER_ID_UNIQUE_CONSTRAINT
    ) {
      return true;
    }

    if (!('cause' in current)) {
      return false;
    }

    current = current.cause;
  }

  return false;
}

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
      or(ilike(doctorUsersView.specialty, pattern), ilike(doctorUsersView.doctorAddress, pattern)),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export const createDoctorsRepo = (db: DrizzleDB = DB) => ({
  /**
   * Liste les médecins disponibles à la prise de rendez-vous (vue patient).
   * Filtrable par spécialité, ville et recherche textuelle (spécialité, adresse).
   */
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

  /**
   * Récupère le profil médecin (spécialité, adresse, ville) à partir du `users.id`.
   * @returns Le profil médecin, ou `null` si l'utilisateur n'a pas de profil médecin.
   */
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

  /**
   * Crée un profil médecin pour un utilisateur existant.
   * @returns Le profil médecin créé.
   */
  createByUserId: async (
    userId: string,
    data: { specialty: string; address: string; city: string },
  ) => {
    try {
      const [row] = await db
        .insert(doctors)
        .values({ userId, ...data })
        .returning();
      return row;
    } catch (error) {
      if (isDoctorUserIdUniqueViolation(error)) {
        throw new DoctorProfileAlreadyExistsError();
      }

      throw error;
    }
  },

  /**
   * Met à jour le profil médecin et touche `users.updatedAt` dans une transaction.
   * @returns Le profil médecin mis à jour, ou `null` si aucun profil n'existe pour ce user.
   */
  updateByUserId: (
    userId: string,
    data: Partial<{
      specialty: string;
      address: string;
      city: string;
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

  /**
   * Compte le nombre total de médecins disponibles (mêmes filtres que `listBookable`, sans pagination).
   */
  countBookable: async (params: Omit<ListBookableParams, 'offset' | 'limit'>) => {
    const where = buildFilters({ ...params, offset: 0, limit: 0 });

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(doctorUsersView)
      .where(where);

    return Number(row.count);
  },

  /**
   * Liste tous les médecins (vue admin) avec nom, email et image.
   * Filtrable par spécialité, ville et recherche textuelle (nom, email, spécialité, ville).
   */
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

  /**
   * Compte le nombre total de médecins (mêmes filtres que `listAllAdmin`, sans pagination).
   */
  countAllAdmin: async (params: Omit<ListAllAdminParams, 'offset' | 'limit'>) => {
    const where = buildAdminFilters({ ...params, offset: 0, limit: 0 });

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(doctorUsersView)
      .where(where);

    return Number(row.count);
  },
});
