/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from '../schema';
import { appointments, doctorBlocks, doctors, users } from '../schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export interface CreateAppointmentInput {
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  reason?: string;
}

export interface ListByPatientParams {
  patientId: string;
  status?: string;
  from?: string;
  to?: string;
  offset: number;
  limit: number;
  sort: 'dateAsc' | 'dateDesc' | 'createdAtDesc';
}

export interface ListAllParams {
  status?: string;
  from?: string;
  to?: string;
  doctorId?: string;
  search?: string;
  offset: number;
  limit: number;
  sort: 'dateAsc' | 'dateDesc' | 'createdAtDesc';
}

function buildAllFilters(params: ListAllParams) {
  const conditions = [];

  if (params.status) {
    conditions.push(eq(appointments.status, params.status as any));
  }
  if (params.from) {
    conditions.push(gte(appointments.date, params.from));
  }
  if (params.to) {
    conditions.push(lte(appointments.date, params.to));
  }
  if (params.doctorId) {
    conditions.push(eq(appointments.doctorId, params.doctorId));
  }
  if (params.search) {
    const pattern = `%${params.search}%`;
    conditions.push(
      or(ilike(sql`doctor_user.name`, pattern), ilike(sql`patient_user.name`, pattern)),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function buildPatientFilters(params: ListByPatientParams) {
  const conditions = [eq(appointments.patientId, params.patientId)];

  if (params.status) {
    conditions.push(eq(appointments.status, params.status as any));
  }
  if (params.from) {
    conditions.push(gte(appointments.date, params.from));
  }
  if (params.to) {
    conditions.push(lte(appointments.date, params.to));
  }

  return and(...conditions);
}

function buildOrderBy(sort: ListByPatientParams['sort']) {
  switch (sort) {
    case 'dateAsc':
      return [asc(appointments.date), asc(appointments.time)];
    case 'dateDesc':
      return [desc(appointments.date), desc(appointments.time)];
    case 'createdAtDesc':
      return [desc(appointments.createdAt)];
  }
}

export const createAppointmentsRepo = (db: DrizzleDB) => ({
  getByIdWithDoctor: async (id: string) => {
    const [row] = await db
      .select({
        id: appointments.id,
        doctorId: appointments.doctorId,
        patientId: appointments.patientId,
        date: appointments.date,
        time: appointments.time,
        status: appointments.status,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        doctor: {
          id: doctors.id,
          name: users.name,
          specialty: doctors.specialty,
          address: doctors.address,
        },
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .leftJoin(users, eq(doctors.userId, users.id))
      .where(eq(appointments.id, id))
      .limit(1);

    return row ?? null;
  },

  listByPatient: async (params: ListByPatientParams) => {
    const where = buildPatientFilters(params);
    const order = buildOrderBy(params.sort);

    return await db
      .select({
        id: appointments.id,
        doctorId: appointments.doctorId,
        patientId: appointments.patientId,
        date: appointments.date,
        time: appointments.time,
        status: appointments.status,
        reason: appointments.reason,
        doctor: {
          id: doctors.id,
          name: users.name,
          specialty: doctors.specialty,
          address: doctors.address,
        },
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .leftJoin(users, eq(doctors.userId, users.id))
      .where(where)
      .orderBy(...order)
      .limit(params.limit)
      .offset(params.offset);
  },

  countByPatient: async (params: Omit<ListByPatientParams, 'offset' | 'limit' | 'sort'>) => {
    const where = buildPatientFilters({ ...params, offset: 0, limit: 0, sort: 'dateDesc' });

    const [row] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(where);

    return Number(row.count);
  },

  listAll: async (params: ListAllParams) => {
    const doctorUser = db.select({ id: users.id, name: users.name }).from(users).as('doctor_user');
    const patientUser = db
      .select({ id: users.id, name: users.name })
      .from(users)
      .as('patient_user');

    const where = buildAllFilters(params);
    const order = buildOrderBy(params.sort);

    return await db
      .select({
        id: appointments.id,
        doctorId: appointments.doctorId,
        patientId: appointments.patientId,
        date: appointments.date,
        time: appointments.time,
        status: appointments.status,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        doctorName: doctorUser.name,
        patientName: patientUser.name,
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .leftJoin(doctorUser, eq(doctors.userId, doctorUser.id))
      .leftJoin(patientUser, eq(appointments.patientId, patientUser.id))
      .where(where)
      .orderBy(...order)
      .limit(params.limit)
      .offset(params.offset);
  },

  countAll: async (params: Omit<ListAllParams, 'offset' | 'limit' | 'sort'>) => {
    const doctorUser = db.select({ id: users.id, name: users.name }).from(users).as('doctor_user');
    const patientUser = db
      .select({ id: users.id, name: users.name })
      .from(users)
      .as('patient_user');

    const where = buildAllFilters({ ...params, offset: 0, limit: 0, sort: 'dateDesc' });

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .leftJoin(doctorUser, eq(doctors.userId, doctorUser.id))
      .leftJoin(patientUser, eq(appointments.patientId, patientUser.id))
      .where(where);

    return Number(row.count);
  },

  updateStatus: async (id: string, status: string) => {
    const [row] = await db
      .update(appointments)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning({
        id: appointments.id,
        doctorId: appointments.doctorId,
        patientId: appointments.patientId,
        date: appointments.date,
        time: appointments.time,
        status: appointments.status,
      });

    return row ?? null;
  },

  createAppointmentAtomic: async (input: CreateAppointmentInput) => {
    return await db.transaction(
      async tx => {
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
