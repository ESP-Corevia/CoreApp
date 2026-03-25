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
  createMedication: async (input: CreateMedicationInput) => {
    const [row] = await db
      .insert(patientMedications)
      .values({
        patientId: input.patientId,
        medicationExternalId: input.medicationExternalId ?? null,
        source: input.source,
        cis: input.cis ?? null,
        cip: input.cip ?? null,
        medicationName: input.medicationName,
        medicationForm: input.medicationForm ?? null,
        activeSubstances: input.activeSubstances ?? null,
        dosageLabel: input.dosageLabel ?? null,
        instructions: input.instructions ?? null,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
      })
      .returning();
    return row;
  },

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
          medicationExternalId: medInput.medicationExternalId ?? null,
          source: medInput.source,
          cis: medInput.cis ?? null,
          cip: medInput.cip ?? null,
          medicationName: medInput.medicationName,
          medicationForm: medInput.medicationForm ?? null,
          activeSubstances: medInput.activeSubstances ?? null,
          dosageLabel: medInput.dosageLabel ?? null,
          instructions: medInput.instructions ?? null,
          startDate: medInput.startDate,
          endDate: medInput.endDate ?? null,
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

  getById: async (id: string) => {
    return (
      (await db.query.patientMedications.findFirst({
        where: eq(patientMedications.id, id),
      })) ?? null
    );
  },

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

  deleteMedication: async (id: string) => {
    const [row] = await db
      .delete(patientMedications)
      .where(eq(patientMedications.id, id))
      .returning({ id: patientMedications.id });
    return row ?? null;
  },

  // ─── Schedules ──────────────────────────────────

  createSchedule: async (input: CreateScheduleInput) => {
    const [row] = await db
      .insert(patientMedicationSchedules)
      .values({
        patientMedicationId: input.patientMedicationId,
        weekday: input.weekday ?? null,
        intakeTime: input.intakeTime,
        intakeMoment: input.intakeMoment,
        quantity: input.quantity,
        unit: input.unit ?? null,
        notes: input.notes ?? null,
      })
      .returning();
    return row;
  },

  getScheduleById: async (id: string) => {
    return (
      (await db.query.patientMedicationSchedules.findFirst({
        where: eq(patientMedicationSchedules.id, id),
      })) ?? null
    );
  },

  getSchedulesByIds: async (ids: string[]) => {
    if (ids.length === 0) return [];
    return await db
      .select()
      .from(patientMedicationSchedules)
      .where(inArray(patientMedicationSchedules.id, ids));
  },

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

  deleteSchedule: async (id: string) => {
    const [row] = await db
      .delete(patientMedicationSchedules)
      .where(eq(patientMedicationSchedules.id, id))
      .returning({ id: patientMedicationSchedules.id });
    return row ?? null;
  },

  listSchedulesByMedication: async (patientMedicationId: string) => {
    return await db
      .select()
      .from(patientMedicationSchedules)
      .where(eq(patientMedicationSchedules.patientMedicationId, patientMedicationId))
      .orderBy(asc(patientMedicationSchedules.intakeTime));
  },

  // ─── Intakes ────────────────────────────────────

  createIntake: async (data: {
    patientMedicationId: string;
    scheduleId?: string | null;
    scheduledDate: string;
    scheduledTime: string;
  }) => {
    const [row] = await db
      .insert(patientMedicationIntakes)
      .values({
        patientMedicationId: data.patientMedicationId,
        scheduleId: data.scheduleId ?? null,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
      })
      .returning();
    return row;
  },

  createManyIntakes: async (
    data: Array<{
      patientMedicationId: string;
      scheduleId?: string | null;
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
          scheduleId: d.scheduleId ?? null,
          scheduledDate: d.scheduledDate,
          scheduledTime: d.scheduledTime,
        })),
      )
      .returning();
  },

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

  getIntakeById: async (id: string) => {
    return (
      (await db.query.patientMedicationIntakes.findFirst({
        where: eq(patientMedicationIntakes.id, id),
      })) ?? null
    );
  },

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

  updateIntakeStatus: async (id: string, status: 'TAKEN' | 'SKIPPED', notes?: string | null) => {
    const [row] = await db
      .update(patientMedicationIntakes)
      .set({
        status,
        takenAt: status === 'TAKEN' ? new Date() : null,
        notes: notes ?? null,
      })
      .where(
        and(eq(patientMedicationIntakes.id, id), eq(patientMedicationIntakes.status, 'PENDING')),
      )
      .returning();
    return row ?? null;
  },

  // Check if intakes already exist for a medication on a date
  intakesExistForDate: async (patientMedicationId: string, date: string) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(patientMedicationIntakes)
      .where(
        and(
          eq(patientMedicationIntakes.patientMedicationId, patientMedicationId),
          eq(patientMedicationIntakes.scheduledDate, date),
        ),
      );
    return Number(row.count) > 0;
  },

  // ─── Admin Queries ──────────────────────────────────

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
