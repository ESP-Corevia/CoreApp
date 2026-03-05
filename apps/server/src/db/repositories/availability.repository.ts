import { and, eq, inArray } from 'drizzle-orm';

import { appointments, doctorBlocks, doctors } from '../schema';

import type * as schema from '../schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export const createAvailabilityRepo = (db: DrizzleDB) => ({
  doctorExists: async (doctorId: string): Promise<boolean> => {
    const [row] = await db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.id, doctorId))
      .limit(1);
    return !!row;
  },

  getReservedSlots: async (doctorId: string, date: string): Promise<string[]> => {
    const rows = await db
      .select({ time: appointments.time })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.date, date),
          inArray(appointments.status, ['PENDING', 'CONFIRMED']),
        ),
      );
    return rows.map((r) => r.time);
  },

  getBlockedSlots: async (doctorId: string, date: string): Promise<string[]> => {
    const rows = await db
      .select({ time: doctorBlocks.time })
      .from(doctorBlocks)
      .where(and(eq(doctorBlocks.doctorId, doctorId), eq(doctorBlocks.date, date)));
    return rows.map((r) => r.time);
  },
});
