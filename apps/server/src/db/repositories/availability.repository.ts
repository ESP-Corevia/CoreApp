import { and, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from '../schema';
import { appointments, doctorBlocks } from '../schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export const createAvailabilityRepo = (db: DrizzleDB) => ({
  /**
   * Récupère les créneaux horaires déjà réservés (PENDING ou CONFIRMED) pour un médecin à une date donnée.
   * @returns Liste des heures occupées (ex: ["09:00", "10:30"]).
   */
  getReservedSlots: async (doctorUserId: string, date: string): Promise<string[]> => {
    const rows = await db
      .select({ time: appointments.time })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorUserId),
          eq(appointments.date, date),
          inArray(appointments.status, ['PENDING', 'CONFIRMED']),
        ),
      );
    return rows.map(r => r.time);
  },

  /**
   * Récupère les créneaux bloqués manuellement par un médecin (indisponibilités) à une date donnée.
   * @returns Liste des heures bloquées (ex: ["12:00", "14:00"]).
   */
  getBlockedSlots: async (doctorUserId: string, date: string): Promise<string[]> => {
    const rows = await db
      .select({ time: doctorBlocks.time })
      .from(doctorBlocks)
      .where(and(eq(doctorBlocks.doctorId, doctorUserId), eq(doctorBlocks.date, date)));
    return rows.map(r => r.time);
  },
});
