import { TRPCError } from '@trpc/server';
import type { z } from 'zod';
import type { MedicationsProvider } from '../../lib/medications/api-medicaments-fr.client';
import type {
  AddScheduleInputSchema,
  CreatePatientMedicationInputSchema,
  ListPillboxInputSchema,
  UpdatePatientMedicationInputSchema,
  UpdateScheduleInputSchema,
} from '../../lib/medications/medications.schemas';
import type { MedicationsRepo } from '../repositories/medications.repository';

function getParisNow(): { date: string; weekday: number } {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
  const weekday = new Date(`${date}T12:00:00`).getDay(); // 0=Sunday
  return { date, weekday };
}

function isMedicationActiveOnDate(
  med: { startDate: string; endDate: string | null },
  date: string,
): boolean {
  return med.startDate <= date && (!med.endDate || med.endDate >= date);
}

export const createMedicationsService = (repo: MedicationsRepo, provider: MedicationsProvider) => {
  async function createMedicationWithSchedules(
    patientId: string,
    input: z.infer<typeof CreatePatientMedicationInputSchema>,
  ) {
    if (input.endDate && input.startDate > input.endDate) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'End date must be after start date',
      });
    }

    const medInput = {
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
    };

    const scheduleInputs = input.schedules.map(s => ({
      patientMedicationId: '', // set by repo inside transaction
      weekday: s.weekday ?? null,
      intakeTime: s.intakeTime,
      intakeMoment: s.intakeMoment,
      quantity: s.quantity,
      unit: s.unit ?? null,
      notes: s.notes ?? null,
    }));

    // Pre-compute which schedules need intakes for today
    const { date, weekday } = getParisNow();
    const isActiveToday = isMedicationActiveOnDate(
      { startDate: input.startDate, endDate: input.endDate ?? null },
      date,
    );

    const intakeInputs: Array<{
      scheduleIndex: number;
      scheduledDate: string;
      scheduledTime: string;
    }> = [];
    if (isActiveToday) {
      input.schedules.forEach((s, i) => {
        if (s.weekday === undefined || s.weekday === null || s.weekday === weekday) {
          intakeInputs.push({
            scheduleIndex: i,
            scheduledDate: date,
            scheduledTime: s.intakeTime,
          });
        }
      });
    }

    const created = await repo.createMedicationAtomic(medInput, scheduleInputs, intakeInputs);
    // Re-fetch to include user info (patientName, patientEmail) for the output schema
    const detail = await repo.getDetailById(created.id);
    if (!detail) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch created medication',
      });
    }
    return detail;
  }

  async function generateAndFetchTodayIntakes(patientId: string) {
    const { date, weekday } = getParisNow();

    // Get all active medications for today (paginate to avoid missing any)
    const activeMeds = [];
    let offset = 0;
    const pageSize = 100;
    while (true) {
      const page = await repo.listByPatient({
        patientId,
        isActive: true,
        offset,
        limit: pageSize,
      });
      activeMeds.push(...page);
      if (page.length < pageSize) break;
      offset += pageSize;
    }

    // For each medication, ensure intakes exist for today per schedule
    for (const med of activeMeds) {
      if (!isMedicationActiveOnDate(med, date)) continue;

      const schedules = await repo.listSchedulesByMedication(med.id);
      const todaySchedules = schedules.filter(s => s.weekday === null || s.weekday === weekday);

      if (todaySchedules.length > 0) {
        await repo.ensureIntakesForSchedules(
          todaySchedules.map(s => ({
            patientMedicationId: med.id,
            scheduleId: s.id,
            scheduledDate: date,
            scheduledTime: s.intakeTime,
          })),
        );
      }
    }

    // Fetch all intakes for today with medication info
    const intakes = await repo.listIntakesByDate(patientId, date);

    // Batch fetch schedule info to avoid N+1
    const scheduleIds = [...new Set(intakes.map(i => i.scheduleId).filter(Boolean))] as string[];
    const schedules = scheduleIds.length > 0 ? await repo.getSchedulesByIds(scheduleIds) : [];
    const scheduleMap = new Map(schedules.map(s => [s.id, s]));

    const enriched = intakes.map(intake => {
      const schedule = intake.scheduleId ? scheduleMap.get(intake.scheduleId) : undefined;
      return {
        ...intake,
        intakeMoment: schedule?.intakeMoment ?? null,
        quantity: schedule?.quantity ?? null,
        unit: schedule?.unit ?? null,
      };
    });

    return { date, intakes: enriched };
  }

  return {
    /**
     * Recherche des médicaments dans l'API externe (api-medicaments-fr).
     */
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

    /**
     * Récupère un médicament depuis l'API externe par code CIS, CIP ou ID externe.
     */
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

    /**
     * Liste les médicaments du patient connecté avec pagination, filtrable par statut actif/inactif.
     */
    listMine: async (patientId: string, query: z.infer<typeof ListPillboxInputSchema>) => {
      const offset = (query.page - 1) * query.limit;
      const [items, total] = await Promise.all([
        repo.listByPatient({ patientId, isActive: query.isActive, offset, limit: query.limit }),
        repo.countByPatient({ patientId, isActive: query.isActive }),
      ]);
      return { items, page: query.page, limit: query.limit, total };
    },

    /**
     * Récupère le détail d'un médicament avec ses schedules et les infos du patient.
     * Vérifie que l'utilisateur est le patient concerné ou un admin.
     * @throws NOT_FOUND si le médicament n'existe pas.
     * @throws FORBIDDEN si l'utilisateur n'est ni le patient ni un admin.
     */
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

    /**
     * Crée un médicament avec ses schedules et génère les intakes du jour si applicable.
     * @throws BAD_REQUEST si la date de fin est avant la date de début.
     */
    createMedication: (
      patientId: string,
      input: z.infer<typeof CreatePatientMedicationInputSchema>,
    ) => {
      return createMedicationWithSchedules(patientId, input);
    },

    /**
     * Met à jour un médicament du patient connecté (posologie, instructions, dates, statut).
     * @throws NOT_FOUND si le médicament n'existe pas.
     * @throws FORBIDDEN si le médicament n'appartient pas au patient.
     */
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

    /**
     * Supprime un médicament du patient connecté (cascade sur schedules et intakes).
     * @throws NOT_FOUND si le médicament n'existe pas.
     * @throws FORBIDDEN si le médicament n'appartient pas au patient.
     */
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

    //Schedules

    /**
     * Ajoute un schedule à un médicament existant.
     * @throws NOT_FOUND si le médicament n'existe pas.
     * @throws FORBIDDEN si le médicament n'appartient pas au patient (sauf admin).
     */
    addSchedule: async (
      userId: string,
      input: z.infer<typeof AddScheduleInputSchema>,
      isAdmin: boolean,
    ) => {
      const med = await repo.getById(input.patientMedicationId);
      if (!med) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
      }
      if (med.patientId !== userId && !isAdmin) {
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

    /**
     * Met à jour un schedule existant (jour, heure, moment, quantité, unité, notes).
     * @throws NOT_FOUND si le schedule n'existe pas.
     * @throws FORBIDDEN si le médicament associé n'appartient pas au patient (sauf admin).
     */
    updateSchedule: async (
      userId: string,
      input: z.infer<typeof UpdateScheduleInputSchema>,
      isAdmin: boolean,
    ) => {
      const schedule = await repo.getScheduleById(input.id);
      if (!schedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
      }
      const med = await repo.getById(schedule.patientMedicationId);
      if (!med || (med.patientId !== userId && !isAdmin)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const { id, ...data } = input;
      return await repo.updateSchedule(id, data);
    },

    /**
     * Supprime un schedule existant.
     * @throws NOT_FOUND si le schedule n'existe pas.
     * @throws FORBIDDEN si le médicament associé n'appartient pas au patient (sauf admin).
     */
    deleteSchedule: async (userId: string, scheduleId: string, isAdmin: boolean) => {
      const schedule = await repo.getScheduleById(scheduleId);
      if (!schedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
      }
      const med = await repo.getById(schedule.patientMedicationId);
      if (!med || (med.patientId !== userId && !isAdmin)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return await repo.deleteSchedule(scheduleId);
    },

    //Today / Intakes

    /**
     * Génère les prises du jour pour le patient et retourne la liste enrichie
     * (nom du médicament, moment, quantité, unité).
     */
    today: (patientId: string) => {
      return generateAndFetchTodayIntakes(patientId);
    },

    /**
     * Marque une prise comme TAKEN. Ne fonctionne que si la prise est encore PENDING.
     * @throws NOT_FOUND si la prise n'existe pas.
     * @throws FORBIDDEN si le médicament n'appartient pas au patient.
     * @throws BAD_REQUEST si la prise n'est plus en statut PENDING.
     */
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

    /**
     * Marque une prise comme SKIPPED. Ne fonctionne que si la prise est encore PENDING.
     * @throws NOT_FOUND si la prise n'existe pas.
     * @throws FORBIDDEN si le médicament n'appartient pas au patient.
     * @throws BAD_REQUEST si la prise n'est plus en statut PENDING.
     */
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

    // ─── Doctor Operations ──────────────────────────────

    /**
     * Liste les médicaments d'un patient (vue médecin). Read-only.
     */
    doctorListPatientPillbox: async (
      patientId: string,
      query: z.infer<typeof ListPillboxInputSchema>,
    ) => {
      const offset = (query.page - 1) * query.limit;
      const [items, total] = await Promise.all([
        repo.listByPatient({ patientId, isActive: query.isActive, offset, limit: query.limit }),
        repo.countByPatient({ patientId, isActive: query.isActive }),
      ]);
      return { items, page: query.page, limit: query.limit, total };
    },

    /**
     * Récupère les prises du jour d'un patient (vue médecin). Read-only.
     */
    doctorViewPatientToday: (patientId: string) => {
      return generateAndFetchTodayIntakes(patientId);
    },

    /**
     * Récupère le détail d'un médicament d'un patient (vue médecin). Read-only.
     * @throws NOT_FOUND si le médicament n'existe pas.
     */
    doctorViewMedicationDetail: async (medicationId: string) => {
      const med = await repo.getDetailById(medicationId);
      if (!med) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
      }
      return med;
    },

    //Admin Operations

    /**
     * Liste tous les médicaments (vue admin) avec nom/email du patient.
     * Filtrable par patient, recherche textuelle et statut actif.
     */
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

    /**
     * Crée un médicament en tant qu'admin pour un patient donné (pas de vérification de propriété).
     */
    adminCreateMedication: (
      patientId: string,
      input: z.infer<typeof CreatePatientMedicationInputSchema>,
    ) => {
      return createMedicationWithSchedules(patientId, input);
    },

    /**
     * Met à jour un médicament en tant qu'admin (pas de vérification de propriété).
     * @throws NOT_FOUND si le médicament n'existe pas.
     */
    adminUpdateMedication: async (input: z.infer<typeof UpdatePatientMedicationInputSchema>) => {
      const existing = await repo.getById(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
      }
      const { id, ...updateData } = input;
      return await repo.updateMedication(id, updateData);
    },

    /**
     * Supprime un médicament en tant qu'admin (pas de vérification de propriété).
     * @throws NOT_FOUND si le médicament n'existe pas.
     */
    adminDeleteMedication: async (medicationId: string) => {
      const existing = await repo.getById(medicationId);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' });
      }
      return await repo.deleteMedication(medicationId);
    },

    /**
     * Génère et récupère les prises du jour pour un patient donné (vue admin).
     */
    adminTodayByPatient: (patientId: string) => {
      return generateAndFetchTodayIntakes(patientId);
    },
  };
};

export type MedicationsService = ReturnType<typeof createMedicationsService>;
