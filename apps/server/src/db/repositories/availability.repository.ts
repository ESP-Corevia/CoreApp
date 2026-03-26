import { and, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from '../schema';
import { appointments, doctorBlocks, doctors } from '../schema';

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

  getDoctorUserId: async (doctorId: string): Promise<string | null> => {
    const [row] = await db
      .select({ userId: doctors.userId })
      .from(doctors)
      .where(eq(doctors.id, doctorId))
      .limit(1);
    return row?.userId ?? null;
  },

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

  getBlockedSlots: async (doctorUserId: string, date: string): Promise<string[]> => {
    const rows = await db
      .select({ time: doctorBlocks.time })
      .from(doctorBlocks)
      .where(and(eq(doctorBlocks.doctorId, doctorUserId), eq(doctorBlocks.date, date)));
    return rows.map(r => r.time);
  },
});
