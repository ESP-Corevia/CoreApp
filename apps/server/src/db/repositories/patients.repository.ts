import { eq } from 'drizzle-orm';

import { db as DB } from '../index';
import { patients, users } from '../schema';

import type * as schema from '../schema';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export type Patient = InferSelectModel<typeof patients>;
export type PatientInsert = InferInsertModel<typeof patients>;
export type PatientUpdate = Omit<PatientInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export const createPatientsRepo = (db: DrizzleDB = DB) => ({
  findByUserId: async (userId: string): Promise<Patient | null> => {
    const [row] = await db
      .select({
        id: patients.id,
        userId: patients.userId,
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

  upsert: async (userId: string, data: PatientUpdate): Promise<Patient> => {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(patients)
        .values({ ...data, userId })
        .onConflictDoUpdate({
          target: patients.userId,
          set: { ...data },
        })
        .returning();

      await tx.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId));

      return row!;
    });
  },
});
