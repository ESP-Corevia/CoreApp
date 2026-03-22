import { TRPCError } from '@trpc/server';

import type { MedicationsProvider } from '../../lib/medications/api-medicaments-fr.client';
import type {
  CreatePatientMedicationInputSchema,
  UpdatePatientMedicationInputSchema,
  ListPillboxInputSchema,
  AddScheduleInputSchema,
  UpdateScheduleInputSchema,
} from '../../lib/medications/medications.schemas';
import type { MedicationsRepo } from '../repositories/medications.repository';
import type { z } from 'zod';

function getParisNow(): { date: string; weekday: number } {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
  const dayOfWeek = new Date(date + 'T12:00:00+01:00').getDay(); // 0=Sunday
  return { date, weekday: dayOfWeek };
}

export const createMedicationsService = (repo: MedicationsRepo, provider: MedicationsProvider) => ({
  search: async (input: { query: string; page: number; limit: number }) => {
    try {
      return await provider.search(input.query, input.page, input.limit);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search medications',
        cause: error,
      });
    }
  },

  getByCode: async (input: { cis?: string; cip?: string; externalId?: string }) => {
    try {
      return await provider.getByCode(input);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch medication',
        cause: error,
      });
    }
  },

  //Pillbox

  listMine: async (patientId: string, query: z.infer<typeof ListPillboxInputSchema>) => {
    const offset = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      repo.listByPatient({ patientId, isActive: query.isActive, offset, limit: query.limit }),
      repo.countByPatient({ patientId, isActive: query.isActive }),
    ]);
    return { items, page: query.page, limit: query.limit, total };
  },

  detail: async (userId: string, medicationId: string, isAdmin: boolean) => {
    const med = await repo.getDetailById(medicationId);
    if (!med) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
    }
    if (med.patientId !== userId && !isAdmin) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    return med;
  },

  createMedication: async (
    patientId: string,
    input: z.infer<typeof CreatePatientMedicationInputSchema>,
  ) => {
    // Validate dates
    if (input.endDate && input.startDate > input.endDate) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'End date must be after start date',
      });
    }

    const med = await repo.createMedication({
      patientId,
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
    });

    // Create schedules
    const schedules = await Promise.all(
      input.schedules.map((s) =>
        repo.createSchedule({
          patientMedicationId: med.id,
          weekday: s.weekday ?? null,
          intakeTime: s.intakeTime,
          intakeMoment: s.intakeMoment,
          quantity: s.quantity,
          unit: s.unit ?? null,
          notes: s.notes ?? null,
        }),
      ),
    );

    // Generate intakes for today if applicable
    const { date, weekday } = getParisNow();
    if (med.startDate <= date && (!med.endDate || med.endDate >= date)) {
      const todaySchedules = schedules.filter((s) => s.weekday === null || s.weekday === weekday);
      if (todaySchedules.length > 0) {
        await repo.createManyIntakes(
          todaySchedules.map((s) => ({
            patientMedicationId: med.id,
            scheduleId: s.id,
            scheduledDate: date,
            scheduledTime: s.intakeTime,
          })),
        );
      }
    }

    return { ...med, schedules };
  },

  updateMedication: async (
    userId: string,
    input: z.infer<typeof UpdatePatientMedicationInputSchema>,
  ) => {
    const existing = await repo.getById(input.id);
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
    }
    if (existing.patientId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    const { id, ...updateData } = input;
    const updated = await repo.updateMedication(id, updateData);
    return updated;
  },

  deleteMedication: async (userId: string, medicationId: string) => {
    const existing = await repo.getById(medicationId);
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
    }
    if (existing.patientId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    return await repo.deleteMedication(medicationId);
  },

  // ─── Schedules ──────────────────────────────────

  addSchedule: async (userId: string, input: z.infer<typeof AddScheduleInputSchema>) => {
    const med = await repo.getById(input.patientMedicationId);
    if (!med) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
    }
    if (med.patientId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    return await repo.createSchedule({
      patientMedicationId: input.patientMedicationId,
      weekday: input.weekday ?? null,
      intakeTime: input.intakeTime,
      intakeMoment: input.intakeMoment,
      quantity: input.quantity,
      unit: input.unit ?? null,
      notes: input.notes ?? null,
    });
  },

  updateSchedule: async (userId: string, input: z.infer<typeof UpdateScheduleInputSchema>) => {
    const schedule = await repo.getScheduleById(input.id);
    if (!schedule) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
    }
    const med = await repo.getById(schedule.patientMedicationId);
    if (!med || med.patientId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    const { id, ...data } = input;
    return await repo.updateSchedule(id, data);
  },

  deleteSchedule: async (userId: string, scheduleId: string) => {
    const schedule = await repo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
    }
    const med = await repo.getById(schedule.patientMedicationId);
    if (!med || med.patientId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    return await repo.deleteSchedule(scheduleId);
  },

  // ─── Today / Intakes ───────────────────────────

  today: async (patientId: string) => {
    const { date, weekday } = getParisNow();

    // Get all active medications for today
    const activeMeds = await repo.listByPatient({
      patientId,
      isActive: true,
      offset: 0,
      limit: 100,
    });

    // For each medication, ensure intakes exist for today
    for (const med of activeMeds) {
      if (med.startDate > date || (med.endDate && med.endDate < date)) continue;

      const alreadyExists = await repo.intakesExistForDate(med.id, date);
      if (alreadyExists) continue;

      // Get schedules and filter by weekday
      const schedules = await repo.listSchedulesByMedication(med.id);
      const todaySchedules = schedules.filter((s) => s.weekday === null || s.weekday === weekday);

      if (todaySchedules.length > 0) {
        await repo.createManyIntakes(
          todaySchedules.map((s) => ({
            patientMedicationId: med.id,
            scheduleId: s.id,
            scheduledDate: date,
            scheduledTime: s.intakeTime,
          })),
        );
      }
    }

    // Now fetch all intakes for today with medication info
    const intakes = await repo.listIntakesByDate(patientId, date);

    // Enrich with schedule info (intakeMoment, quantity, unit)
    const enriched = await Promise.all(
      intakes.map(async (intake) => {
        let intakeMoment: string | null = null;
        let quantity: string | null = null;
        let unit: string | null = null;

        if (intake.scheduleId) {
          const schedule = await repo.getScheduleById(intake.scheduleId);
          if (schedule) {
            intakeMoment = schedule.intakeMoment;
            quantity = schedule.quantity;
            unit = schedule.unit;
          }
        }

        return {
          ...intake,
          intakeMoment,
          quantity,
          unit,
        };
      }),
    );

    return { date, intakes: enriched };
  },

  markIntakeTaken: async (userId: string, intakeId: string, notes?: string | null) => {
    const intake = await repo.getIntakeById(intakeId);
    if (!intake) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Intake not found' });
    }

    const med = await repo.getById(intake.patientMedicationId);
    if (!med || med.patientId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    if (intake.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot mark as taken: current status is ${intake.status}`,
      });
    }

    return await repo.updateIntakeStatus(intakeId, 'TAKEN', notes);
  },

  markIntakeSkipped: async (userId: string, intakeId: string, notes?: string | null) => {
    const intake = await repo.getIntakeById(intakeId);
    if (!intake) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Intake not found' });
    }

    const med = await repo.getById(intake.patientMedicationId);
    if (!med || med.patientId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    if (intake.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot mark as skipped: current status is ${intake.status}`,
      });
    }

    return await repo.updateIntakeStatus(intakeId, 'SKIPPED', notes);
  },

  // ─── Admin Operations ──────────────────────────────

  adminListAll: async (query: {
    patientId?: string;
    search?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }) => {
    const offset = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      repo.listAllMedications({
        patientId: query.patientId,
        search: query.search,
        isActive: query.isActive,
        offset,
        limit: query.limit,
      }),
      repo.countAllMedications({
        patientId: query.patientId,
        search: query.search,
        isActive: query.isActive,
      }),
    ]);
    return { items, page: query.page, limit: query.limit, total };
  },

  adminCreateMedication: async (
    patientId: string,
    input: z.infer<typeof CreatePatientMedicationInputSchema>,
  ) => {
    if (input.endDate && input.startDate > input.endDate) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'End date must be after start date',
      });
    }

    const med = await repo.createMedication({
      patientId,
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
    });

    const schedules = await Promise.all(
      input.schedules.map((s) =>
        repo.createSchedule({
          patientMedicationId: med.id,
          weekday: s.weekday ?? null,
          intakeTime: s.intakeTime,
          intakeMoment: s.intakeMoment,
          quantity: s.quantity,
          unit: s.unit ?? null,
          notes: s.notes ?? null,
        }),
      ),
    );

    const { date, weekday } = getParisNow();
    if (med.startDate <= date && (!med.endDate || med.endDate >= date)) {
      const todaySchedules = schedules.filter((s) => s.weekday === null || s.weekday === weekday);
      if (todaySchedules.length > 0) {
        await repo.createManyIntakes(
          todaySchedules.map((s) => ({
            patientMedicationId: med.id,
            scheduleId: s.id,
            scheduledDate: date,
            scheduledTime: s.intakeTime,
          })),
        );
      }
    }

    return { ...med, schedules };
  },

  adminUpdateMedication: async (input: z.infer<typeof UpdatePatientMedicationInputSchema>) => {
    const existing = await repo.getById(input.id);
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
    }
    const { id, ...updateData } = input;
    return await repo.updateMedication(id, updateData);
  },

  adminDeleteMedication: async (medicationId: string) => {
    const existing = await repo.getById(medicationId);
    if (!existing) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
    }
    return await repo.deleteMedication(medicationId);
  },

  adminTodayByPatient: async (patientId: string) => {
    const { date, weekday } = getParisNow();

    const activeMeds = await repo.listByPatient({
      patientId,
      isActive: true,
      offset: 0,
      limit: 100,
    });

    for (const med of activeMeds) {
      if (med.startDate > date || (med.endDate && med.endDate < date)) continue;
      const alreadyExists = await repo.intakesExistForDate(med.id, date);
      if (alreadyExists) continue;
      const schedules = await repo.listSchedulesByMedication(med.id);
      const todaySchedules = schedules.filter((s) => s.weekday === null || s.weekday === weekday);
      if (todaySchedules.length > 0) {
        await repo.createManyIntakes(
          todaySchedules.map((s) => ({
            patientMedicationId: med.id,
            scheduleId: s.id,
            scheduledDate: date,
            scheduledTime: s.intakeTime,
          })),
        );
      }
    }

    const intakes = await repo.listIntakesByDate(patientId, date);

    const enriched = await Promise.all(
      intakes.map(async (intake) => {
        let intakeMoment: string | null = null;
        let quantity: string | null = null;
        let unit: string | null = null;
        if (intake.scheduleId) {
          const schedule = await repo.getScheduleById(intake.scheduleId);
          if (schedule) {
            intakeMoment = schedule.intakeMoment;
            quantity = schedule.quantity;
            unit = schedule.unit;
          }
        }
        return { ...intake, intakeMoment, quantity, unit };
      }),
    );

    return { date, intakes: enriched };
  },
});

export type MedicationsService = ReturnType<typeof createMedicationsService>;
