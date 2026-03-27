/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from '../schema';
import { appointments, doctorBlocks, doctorUsersView, patientUsersView } from '../schema';

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
  status?: string[];
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

  if (params.status && params.status.length > 0) {
    conditions.push(inArray(appointments.status, params.status as any));
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
      or(ilike(doctorUsersView.name, pattern), ilike(patientUsersView.name, pattern)),
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
  /**
   * Récupère un rendez-vous par son ID avec les infos du médecin (nom, spécialité, adresse).
   * @returns Le rendez-vous avec le profil médecin joint, ou `null` si introuvable.
   */
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
          id: doctorUsersView.doctorId,
          name: doctorUsersView.name,
          specialty: doctorUsersView.specialty,
          address: doctorUsersView.doctorAddress,
        },
      })
      .from(appointments)
      .innerJoin(doctorUsersView, eq(appointments.doctorId, doctorUsersView.userId))
      .where(eq(appointments.id, id))
      .limit(1);

    return row ?? null;
  },

  /**
   * Liste les rendez-vous d'un patient avec les infos du médecin.
   * Supporte le filtrage par statut et plage de dates, le tri et la pagination.
   */
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
          id: doctorUsersView.doctorId,
          name: doctorUsersView.name,
          specialty: doctorUsersView.specialty,
          address: doctorUsersView.doctorAddress,
        },
      })
      .from(appointments)
      .innerJoin(doctorUsersView, eq(appointments.doctorId, doctorUsersView.userId))
      .where(where)
      .orderBy(...order)
      .limit(params.limit)
      .offset(params.offset);
  },

  /**
   * Compte le nombre total de rendez-vous d'un patient (mêmes filtres que `listByPatient`, sans pagination).
   * Utilisé pour calculer le nombre total de pages côté client.
   */
  countByPatient: async (params: Omit<ListByPatientParams, 'offset' | 'limit' | 'sort'>) => {
    const where = buildPatientFilters({ ...params, offset: 0, limit: 0, sort: 'dateDesc' });

    const [row] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(where);

    return Number(row.count);
  },

  /**
   * Liste tous les rendez-vous (vue admin) avec les noms du médecin et du patient.
   * Supporte le filtrage par statut, plage de dates, médecin et recherche textuelle (nom médecin/patient).
   */
  listAll: async (params: ListAllParams) => {
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
        doctorName: doctorUsersView.name,
        patientName: patientUsersView.name,
      })
      .from(appointments)
      .innerJoin(doctorUsersView, eq(appointments.doctorId, doctorUsersView.userId))
      .leftJoin(patientUsersView, eq(appointments.patientId, patientUsersView.userId))
      .where(where)
      .orderBy(...order)
      .limit(params.limit)
      .offset(params.offset);
  },

  /**
   * Compte le nombre total de rendez-vous (mêmes filtres que `listAll`, sans pagination).
   * Utilisé pour calculer le nombre total de pages côté admin.
   */
  countAll: async (params: Omit<ListAllParams, 'offset' | 'limit' | 'sort'>) => {
    const where = buildAllFilters({ ...params, offset: 0, limit: 0, sort: 'dateDesc' });

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .innerJoin(doctorUsersView, eq(appointments.doctorId, doctorUsersView.userId))
      .leftJoin(patientUsersView, eq(appointments.patientId, patientUsersView.userId))
      .where(where);

    return Number(row.count);
  },

  /**
   * Met à jour uniquement le statut d'un rendez-vous (PENDING → CONFIRMED, CANCELLED, etc.).
   * @returns Le rendez-vous mis à jour, ou `null` si l'ID n'existe pas.
   */
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

  /**
   * Met à jour partiellement un rendez-vous (médecin, patient, date, heure, motif).
   * @returns Le rendez-vous mis à jour, ou `null` si l'ID n'existe pas.
   */
  update: async (
    id: string,
    data: Partial<
      Pick<CreateAppointmentInput, 'doctorId' | 'patientId' | 'date' | 'time' | 'reason'>
    >,
  ) => {
    const [row] = await db
      .update(appointments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning({
        id: appointments.id,
        doctorId: appointments.doctorId,
        patientId: appointments.patientId,
        date: appointments.date,
        time: appointments.time,
        status: appointments.status,
        reason: appointments.reason,
      });

    return row ?? null;
  },

  /**
   * Supprime un rendez-vous par son ID.
   * @returns Le rendez-vous supprimé, ou `null` si l'ID n'existe pas.
   */
  deleteById: async (id: string) => {
    const [row] = await db.delete(appointments).where(eq(appointments.id, id)).returning({
      id: appointments.id,
      doctorId: appointments.doctorId,
      patientId: appointments.patientId,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
    });

    return row ?? null;
  },

  /**
   * Crée un rendez-vous de manière atomique dans une transaction.
   * Vérifie qu'il n'existe pas déjà un rendez-vous actif (PENDING/CONFIRMED) sur le même créneau,
   * et qu'aucun bloc d'indisponibilité du médecin ne couvre ce créneau.
   * @returns `{ appointment }` en cas de succès, `{ conflict: true }` si le créneau est déjà pris,
   *          ou `{ blocked: true }` si le médecin est indisponible.
   */
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
