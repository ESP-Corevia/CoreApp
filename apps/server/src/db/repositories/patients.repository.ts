import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { escapeLike } from '../../utils/db';
import { db as DB } from '../index';
import type * as schema from '../schema';
import { patients, patientUsersView, users } from '../schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export type Patient = InferSelectModel<typeof patients>;
export type PatientInsert = InferInsertModel<typeof patients>;
export type PatientUpdate = Omit<PatientInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export interface ListAllAdminParams {
  search?: string;
  gender?: string;
  offset: number;
  limit: number;
}

export const createPatientsRepo = (db: DrizzleDB = DB) => ({
  /**
   * Récupère le profil patient (infos médicales et personnelles) à partir du `users.id`.
   * @returns Le profil patient sans `id` ni `userId`, ou `null` si aucun profil n'existe.
   */
  findByUserId: async (userId: string): Promise<Omit<Patient, 'id' | 'userId'> | null> => {
    const [row] = await db
      .select({
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        phone: patients.phone,
        address: patients.address,
        bloodType: patients.bloodType,
        allergies: patients.allergies,
        emergencyContactName: patients.emergencyContactName,
        emergencyContactPhone: patients.emergencyContactPhone,
      })
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);
    return row ?? null;
  },

  /**
   * Liste tous les patients (vue admin) avec infos utilisateur et médicales.
   * Filtrable par recherche textuelle (nom, email) et genre.
   */
  listAllAdmin: async (params: ListAllAdminParams) => {
    const conditions = [];

    if (params.gender) {
      conditions.push(eq(patientUsersView.gender, params.gender));
    }
    if (params.search) {
      const pattern = `%${escapeLike(params.search)}%`;
      conditions.push(
        or(ilike(patientUsersView.name, pattern), ilike(patientUsersView.email, pattern)),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(patientUsersView)
      .where(where)
      .orderBy(asc(patientUsersView.name))
      .limit(params.limit)
      .offset(params.offset);
  },

  /**
   * Compte le nombre total de patients (mêmes filtres que `listAllAdmin`, sans pagination).
   */
  countAllAdmin: async (params: Omit<ListAllAdminParams, 'offset' | 'limit'>) => {
    const conditions = [];

    if (params.gender) {
      conditions.push(eq(patientUsersView.gender, params.gender));
    }
    if (params.search) {
      const pattern = `%${escapeLike(params.search)}%`;
      conditions.push(
        or(ilike(patientUsersView.name, pattern), ilike(patientUsersView.email, pattern)),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientUsersView)
      .where(where);

    return Number(row.count);
  },

  /**
   * Crée un profil patient pour un utilisateur existant.
   * @returns Le profil patient créé.
   */
  createByUserId: async (userId: string, data: PatientUpdate) => {
    const [row] = await db
      .insert(patients)
      .values({ ...data, userId })
      .returning();
    return row;
  },

  /**
   * Met à jour le profil patient et touche `users.updatedAt` dans une transaction.
   * @returns Le profil patient mis à jour, ou `null` si aucun profil n'existe pour ce user.
   */
  updateByUserId: (userId: string, data: Partial<PatientUpdate>) => {
    return db.transaction(async tx => {
      const [patient] = await tx
        .update(patients)
        .set(data)
        .where(eq(patients.userId, userId))
        .returning();

      await tx.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId));

      return patient ?? null;
    });
  },

  /**
   * Supprime le profil patient par `users.id`.
   * @returns L'ID du profil supprimé, ou `null` si introuvable.
   */
  deleteByUserId: async (userId: string) => {
    const [row] = await db
      .delete(patients)
      .where(eq(patients.userId, userId))
      .returning({ id: patients.id });
    return row ?? null;
  },

  /**
   * Crée ou met à jour le profil patient (upsert sur `userId`).
   * Touche `users.updatedAt` dans la même transaction.
   * @returns Le profil patient créé ou mis à jour.
   */
  upsert: async (userId: string, data: PatientUpdate): Promise<Patient> => {
    return await db.transaction(async tx => {
      const [row] = await tx
        .insert(patients)
        .values({ ...data, userId })
        .onConflictDoUpdate({
          target: patients.userId,
          set: { ...data },
        })
        .returning();

      await tx.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId));

      return row;
    });
  },
});
