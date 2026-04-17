import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { escapeLike } from '../../utils/db';
import type * as schema from '../schema';
import {
  patientMedicationIntakes,
  patientMedicationSchedules,
  patientMedications,
  users,
} from '../schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

export interface CreateMedicationInput {
  patientId: string;
  medicationExternalId?: string | null;
  source: string;
  cis?: string | null;
  cip?: string | null;
  medicationName: string;
  medicationForm?: string | null;
  activeSubstances?: string[] | null;
  dosageLabel?: string | null;
  instructions?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface CreateScheduleInput {
  patientMedicationId: string;
  weekday?: number | null;
  intakeTime: string;
  intakeMoment: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
  quantity: string;
  unit?: string | null;
  notes?: string | null;
}

export const createMedicationsRepo = (db: DrizzleDB) => ({
  /**
   * Crée un médicament avec ses schedules et intakes initiales dans une seule transaction.
   * Les `intakeInputs` référencent les schedules par index (position dans `scheduleInputs`).
   * @returns Le médicament créé avec ses schedules.
   */
  createMedicationAtomic: async (
    medInput: CreateMedicationInput,
    scheduleInputs: CreateScheduleInput[],
    intakeInputs: Array<{
      scheduleIndex: number;
      scheduledDate: string;
      scheduledTime: string;
    }>,
  ) => {
    return await db.transaction(async tx => {
      const [med] = await tx
        .insert(patientMedications)
        .values({
          patientId: medInput.patientId,
          medicationExternalId: medInput.medicationExternalId,
          source: medInput.source,
          cis: medInput.cis,
          cip: medInput.cip,
          medicationName: medInput.medicationName,
          medicationForm: medInput.medicationForm,
          activeSubstances: medInput.activeSubstances,
          dosageLabel: medInput.dosageLabel,
          instructions: medInput.instructions,
          startDate: medInput.startDate,
          endDate: medInput.endDate,
        })
        .returning();

      const schedules = await Promise.all(
        scheduleInputs.map(s =>
          tx
            .insert(patientMedicationSchedules)
            .values({
              patientMedicationId: med.id,
              weekday: s.weekday ?? null,
              intakeTime: s.intakeTime,
              intakeMoment: s.intakeMoment,
              quantity: s.quantity,
              unit: s.unit ?? null,
              notes: s.notes ?? null,
            })
            .returning()
            .then(rows => rows[0]),
        ),
      );

      if (intakeInputs.length > 0) {
        await tx.insert(patientMedicationIntakes).values(
          intakeInputs.map(i => ({
            patientMedicationId: med.id,
            scheduleId: schedules[i.scheduleIndex].id,
            scheduledDate: i.scheduledDate,
            scheduledTime: i.scheduledTime,
          })),
        );
      }

      return { ...med, schedules };
    });
  },

  /**
   * Récupère un médicament par son ID (sans relations).
   * @returns Le médicament, ou `null` si introuvable.
   */
  getById: async (id: string) => {
    return (
      (await db.query.patientMedications.findFirst({
        where: eq(patientMedications.id, id),
      })) ?? null
    );
  },

  /**
   * Récupère un médicament par son ID avec le nom/email du patient et ses schedules.
   * @returns Le médicament détaillé, ou `null` si introuvable.
   */
  getDetailById: async (id: string) => {
    const row = await db.query.patientMedications.findFirst({
      where: eq(patientMedications.id, id),
      with: {
        user: { columns: { name: true, email: true } },
        schedules: {
          orderBy: asc(patientMedicationSchedules.intakeTime),
        },
      },
    });
    if (!row) return null;
    const { user, ...med } = row;
    return { ...med, patientName: user?.name ?? null, patientEmail: user?.email ?? null };
  },

  /**
   * Liste les médicaments d'un patient avec pagination, filtrable par statut actif/inactif.
   */
  listByPatient: async (params: {
    patientId: string;
    isActive?: boolean;
    offset: number;
    limit: number;
  }) => {
    const conditions = [eq(patientMedications.patientId, params.patientId)];
    if (params.isActive !== undefined) {
      conditions.push(eq(patientMedications.isActive, params.isActive));
    }

    return await db
      .select()
      .from(patientMedications)
      .where(and(...conditions))
      .orderBy(desc(patientMedications.createdAt))
      .limit(params.limit)
      .offset(params.offset);
  },

  /**
   * Compte les médicaments d'un patient (mêmes filtres que `listByPatient`, sans pagination).
   */
  countByPatient: async (params: { patientId: string; isActive?: boolean }) => {
    const conditions = [eq(patientMedications.patientId, params.patientId)];
    if (params.isActive !== undefined) {
      conditions.push(eq(patientMedications.isActive, params.isActive));
    }

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientMedications)
      .where(and(...conditions));

    return Number(row.count);
  },

  /**
   * Met à jour partiellement un médicament (posologie, instructions, dates, statut actif).
   * @returns Le médicament mis à jour, ou `null` si l'ID n'existe pas.
   */
  updateMedication: async (
    id: string,
    data: Partial<{
      dosageLabel: string | null;
      instructions: string | null;
      startDate: string;
      endDate: string | null;
      isActive: boolean;
    }>,
  ) => {
    const [row] = await db
      .update(patientMedications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patientMedications.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Supprime un médicament par son ID (cascade sur schedules et intakes).
   * @returns L'ID du médicament supprimé, ou `null` si introuvable.
   */
  deleteMedication: async (id: string) => {
    const [row] = await db
      .delete(patientMedications)
      .where(eq(patientMedications.id, id))
      .returning({ id: patientMedications.id });
    return row ?? null;
  },

  // ─── Schedules ──────────────────────────────────

  /**
   * Crée un planning de prise pour un médicament donné.
   * @returns La ligne insérée.
   */
  createSchedule: async (input: CreateScheduleInput) => {
    const [row] = await db
      .insert(patientMedicationSchedules)
      .values({
        patientMedicationId: input.patientMedicationId,
        weekday: input.weekday,
        intakeTime: input.intakeTime,
        intakeMoment: input.intakeMoment,
        quantity: input.quantity,
        unit: input.unit,
        notes: input.notes,
      })
      .returning();
    return row;
  },

  /**
   * Récupère un schedule par son ID.
   * @returns Le schedule, ou `null` si introuvable.
   */
  getScheduleById: async (id: string) => {
    return (
      (await db.query.patientMedicationSchedules.findFirst({
        where: eq(patientMedicationSchedules.id, id),
      })) ?? null
    );
  },

  /**
   * Récupère plusieurs schedules par leurs IDs en une seule requête.
   * @returns Liste des schedules trouvés (peut être plus courte que `ids` si certains n'existent pas).
   */
  getSchedulesByIds: async (ids: string[]) => {
    if (ids.length === 0) return [];
    return await db
      .select()
      .from(patientMedicationSchedules)
      .where(inArray(patientMedicationSchedules.id, ids));
  },

  /**
   * Met à jour partiellement un schedule (jour, heure, moment, quantité, unité, notes).
   * @returns Le schedule mis à jour, ou `null` si l'ID n'existe pas.
   */
  updateSchedule: async (
    id: string,
    data: Partial<{
      weekday: number | null;
      intakeTime: string;
      intakeMoment: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
      quantity: string;
      unit: string | null;
      notes: string | null;
    }>,
  ) => {
    const [row] = await db
      .update(patientMedicationSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patientMedicationSchedules.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Supprime un schedule par son ID.
   * Annule d'abord la référence `schedule_id` sur les prises existantes, car la FK composite
   * (patient_medication_id, schedule_id) avec ON DELETE SET NULL tenterait sinon de mettre
   * `patient_medication_id` (NOT NULL) à NULL, ce qui lève une erreur Postgres.
   * @returns L'ID du schedule supprimé, ou `null` si introuvable.
   */
  deleteSchedule: async (id: string) => {
    return await db.transaction(async tx => {
      await tx
        .update(patientMedicationIntakes)
        .set({ scheduleId: null })
        .where(eq(patientMedicationIntakes.scheduleId, id));

      const [row] = await tx
        .delete(patientMedicationSchedules)
        .where(eq(patientMedicationSchedules.id, id))
        .returning({ id: patientMedicationSchedules.id });
      return row ?? null;
    });
  },

  /**
   * Liste tous les schedules d'un médicament, triés par heure de prise.
   */
  listSchedulesByMedication: async (patientMedicationId: string) => {
    return await db
      .select()
      .from(patientMedicationSchedules)
      .where(eq(patientMedicationSchedules.patientMedicationId, patientMedicationId))
      .orderBy(asc(patientMedicationSchedules.intakeTime));
  },

  // ─── Intakes ────────────────────────────────────

  /**
   * Crée les prises manquantes pour des schedules donnés (upsert : ignore les doublons existants).
   * Utilise `ON CONFLICT DO NOTHING` sur la contrainte unique (médicament, schedule, date).
   * @returns Uniquement les lignes nouvellement insérées.
   */
  ensureIntakesForSchedules: async (
    data: Array<{
      patientMedicationId: string;
      scheduleId: string;
      scheduledDate: string;
      scheduledTime: string;
    }>,
  ) => {
    if (data.length === 0) return [];
    return await db
      .insert(patientMedicationIntakes)
      .values(
        data.map(d => ({
          patientMedicationId: d.patientMedicationId,
          scheduleId: d.scheduleId,
          scheduledDate: d.scheduledDate,
          scheduledTime: d.scheduledTime,
        })),
      )
      .onConflictDoNothing({
        target: [
          patientMedicationIntakes.patientMedicationId,
          patientMedicationIntakes.scheduleId,
          patientMedicationIntakes.scheduledDate,
        ],
      })
      .returning();
  },

  /**
   * Récupère une prise par son ID.
   * @returns La prise, ou `null` si introuvable.
   */
  getIntakeById: async (id: string) => {
    return (
      (await db.query.patientMedicationIntakes.findFirst({
        where: eq(patientMedicationIntakes.id, id),
      })) ?? null
    );
  },

  /**
   * Liste les prises d'un patient pour une date donnée, avec les infos du médicament.
   * Ne retourne que les prises dont le médicament est actif et dont la période couvre la date.
   */
  listIntakesByDate: async (patientId: string, date: string) => {
    return await db
      .select({
        id: patientMedicationIntakes.id,
        patientMedicationId: patientMedicationIntakes.patientMedicationId,
        scheduleId: patientMedicationIntakes.scheduleId,
        scheduledDate: patientMedicationIntakes.scheduledDate,
        scheduledTime: patientMedicationIntakes.scheduledTime,
        status: patientMedicationIntakes.status,
        takenAt: patientMedicationIntakes.takenAt,
        notes: patientMedicationIntakes.notes,
        createdAt: patientMedicationIntakes.createdAt,
        medicationName: patientMedications.medicationName,
        medicationForm: patientMedications.medicationForm,
        dosageLabel: patientMedications.dosageLabel,
      })
      .from(patientMedicationIntakes)
      .innerJoin(
        patientMedications,
        eq(patientMedicationIntakes.patientMedicationId, patientMedications.id),
      )
      .where(
        and(
          eq(patientMedications.patientId, patientId),
          eq(patientMedicationIntakes.scheduledDate, date),
          eq(patientMedications.isActive, true),
          lte(patientMedications.startDate, date),
          or(isNull(patientMedications.endDate), gte(patientMedications.endDate, date)),
        ),
      )
      .orderBy(asc(patientMedicationIntakes.scheduledTime));
  },

  /**
   * Récupère la compliance journalière pour un patient sur une plage de dates.
   * Pour chaque jour ayant des intakes, retourne `true` si TOUTES les prises sont TAKEN, `false` sinon.
   * Ne retourne que les jours ayant au moins une intake.
   */
  listIntakesByDateRange: async (patientId: string, from: string, to: string) => {
    const rows = await db
      .select({
        scheduledDate: patientMedicationIntakes.scheduledDate,
        total: sql<number>`count(*)`,
        taken: sql<number>`count(*) filter (where ${patientMedicationIntakes.status} = 'TAKEN')`,
      })
      .from(patientMedicationIntakes)
      .innerJoin(
        patientMedications,
        eq(patientMedicationIntakes.patientMedicationId, patientMedications.id),
      )
      .where(
        and(
          eq(patientMedications.patientId, patientId),
          gte(patientMedicationIntakes.scheduledDate, from),
          lte(patientMedicationIntakes.scheduledDate, to),
        ),
      )
      .groupBy(patientMedicationIntakes.scheduledDate)
      .orderBy(asc(patientMedicationIntakes.scheduledDate));

    return rows.map(r => ({
      date: r.scheduledDate,
      allTaken: Number(r.total) > 0 && Number(r.taken) === Number(r.total),
    }));
  },

  /**
   * Liste les prises détaillées d'un patient sur une plage de dates avec les infos médicament.
   * Utilisé pour l'affichage de l'historique détaillé côté médecin.
   */
  listIntakeDetailsByDateRange: async (patientId: string, from: string, to: string) => {
    return await db
      .select({
        id: patientMedicationIntakes.id,
        patientMedicationId: patientMedicationIntakes.patientMedicationId,
        scheduledDate: patientMedicationIntakes.scheduledDate,
        scheduledTime: patientMedicationIntakes.scheduledTime,
        status: patientMedicationIntakes.status,
        takenAt: patientMedicationIntakes.takenAt,
        notes: patientMedicationIntakes.notes,
        medicationName: patientMedications.medicationName,
        medicationForm: patientMedications.medicationForm,
        dosageLabel: patientMedications.dosageLabel,
        quantity: patientMedicationSchedules.quantity,
        unit: patientMedicationSchedules.unit,
        intakeMoment: patientMedicationSchedules.intakeMoment,
      })
      .from(patientMedicationIntakes)
      .innerJoin(
        patientMedications,
        eq(patientMedicationIntakes.patientMedicationId, patientMedications.id),
      )
      .leftJoin(
        patientMedicationSchedules,
        eq(patientMedicationIntakes.scheduleId, patientMedicationSchedules.id),
      )
      .where(
        and(
          eq(patientMedications.patientId, patientId),
          gte(patientMedicationIntakes.scheduledDate, from),
          lte(patientMedicationIntakes.scheduledDate, to),
        ),
      )
      .orderBy(
        asc(patientMedicationIntakes.scheduledDate),
        asc(patientMedicationIntakes.scheduledTime),
      );
  },

  /**
   * Met à jour le statut d'une prise (TAKEN ou SKIPPED). Ne fonctionne que si la prise est encore PENDING.
   * Enregistre `takenAt` automatiquement si le statut est TAKEN.
   * @returns La prise mise à jour, ou `null` si introuvable ou déjà traitée.
   */
  updateIntakeStatus: async (id: string, status: 'TAKEN' | 'SKIPPED', notes?: string | null) => {
    const [row] = await db
      .update(patientMedicationIntakes)
      .set({
        status,
        takenAt: status === 'TAKEN' ? new Date() : null,
        notes: notes,
      })
      .where(
        and(eq(patientMedicationIntakes.id, id), eq(patientMedicationIntakes.status, 'PENDING')),
      )
      .returning();
    return row ?? null;
  },

  // ─── Admin Queries ──────────────────────────────────

  /**
   * Liste tous les médicaments (vue admin) avec nom et email du patient.
   * Filtrable par patient, recherche textuelle (nom médicament ou nom patient) et statut actif.
   */
  listAllMedications: async (params: {
    patientId?: string;
    search?: string;
    isActive?: boolean;
    offset: number;
    limit: number;
  }) => {
    const conditions = [];
    if (params.patientId) {
      conditions.push(eq(patientMedications.patientId, params.patientId));
    }
    if (params.isActive !== undefined) {
      conditions.push(eq(patientMedications.isActive, params.isActive));
    }
    if (params.search) {
      conditions.push(
        or(
          ilike(patientMedications.medicationName, `%${escapeLike(params.search)}%`),
          ilike(users.name, `%${escapeLike(params.search)}%`),
        ),
      );
    }

    return await db
      .select({
        id: patientMedications.id,
        patientId: patientMedications.patientId,
        medicationExternalId: patientMedications.medicationExternalId,
        source: patientMedications.source,
        cis: patientMedications.cis,
        cip: patientMedications.cip,
        medicationName: patientMedications.medicationName,
        medicationForm: patientMedications.medicationForm,
        activeSubstances: patientMedications.activeSubstances,
        dosageLabel: patientMedications.dosageLabel,
        instructions: patientMedications.instructions,
        startDate: patientMedications.startDate,
        endDate: patientMedications.endDate,
        isActive: patientMedications.isActive,
        createdAt: patientMedications.createdAt,
        updatedAt: patientMedications.updatedAt,
        patientName: users.name,
        patientEmail: users.email,
      })
      .from(patientMedications)
      .leftJoin(users, eq(patientMedications.patientId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(patientMedications.createdAt))
      .limit(params.limit)
      .offset(params.offset);
  },

  /**
   * Compte tous les médicaments (mêmes filtres que `listAllMedications`, sans pagination).
   */
  countAllMedications: async (params: {
    patientId?: string;
    search?: string;
    isActive?: boolean;
  }) => {
    const conditions = [];
    if (params.patientId) {
      conditions.push(eq(patientMedications.patientId, params.patientId));
    }
    if (params.isActive !== undefined) {
      conditions.push(eq(patientMedications.isActive, params.isActive));
    }
    if (params.search) {
      conditions.push(
        or(
          ilike(patientMedications.medicationName, `%${escapeLike(params.search)}%`),
          ilike(users.name, `%${escapeLike(params.search)}%`),
        ),
      );
    }

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientMedications)
      .leftJoin(users, eq(patientMedications.patientId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Number(row.count);
  },
});

export type MedicationsRepo = ReturnType<typeof createMedicationsRepo>;
