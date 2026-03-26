import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db as DB } from '../index';
import type * as schema from '../schema';
import { patients, users } from '../schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export type Patient = InferSelectModel<typeof patients>;
export type PatientInsert = InferInsertModel<typeof patients>;
export type PatientUpdate = Omit<PatientInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

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
