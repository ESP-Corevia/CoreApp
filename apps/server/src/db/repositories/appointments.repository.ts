import { and, eq, inArray } from 'drizzle-orm';

import { appointments, doctorBlocks } from '../schema';

import type * as schema from '../schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export interface CreateAppointmentInput {
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  reason?: string;
}

export const createAppointmentsRepo = (db: DrizzleDB) => ({
  createAppointmentAtomic: async (input: CreateAppointmentInput) => {
    return await db.transaction(
      async (tx) => {
        // Check for existing appointment (PENDING or CONFIRMED) on same slot
        const [existing] = await tx
          .select({ id: appointments.id })
          .from(appointments)
          .where(
            and(
              eq(appointments.doctorId, input.doctorId),
              eq(appointments.date, input.date),
              eq(appointments.time, input.time),
              inArray(appointments.status, ['PENDING', 'CONFIRMED']),
            ),
          )
          .for('update');

        if (existing) {
          return { conflict: true as const };
        }

        // Check for doctor block on this slot
        const [blocked] = await tx
          .select({ id: doctorBlocks.id })
          .from(doctorBlocks)
          .where(
            and(
              eq(doctorBlocks.doctorId, input.doctorId),
              eq(doctorBlocks.date, input.date),
              eq(doctorBlocks.time, input.time),
            ),
          );

        if (blocked) {
          return { blocked: true as const };
        }

        // Insert the appointment
        const [row] = await tx
          .insert(appointments)
          .values({
            doctorId: input.doctorId,
            patientId: input.patientId,
            date: input.date,
            time: input.time,
            reason: input.reason,
          })
          .returning({
            id: appointments.id,
            doctorId: appointments.doctorId,
            patientId: appointments.patientId,
            date: appointments.date,
            time: appointments.time,
            status: appointments.status,
          });

        return { appointment: row };
      },
      {
        isolationLevel: 'read committed',
      },
    );
  },
});
