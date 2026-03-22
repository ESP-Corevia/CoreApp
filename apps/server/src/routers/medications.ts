import { z } from 'zod';

import {
  SearchMedicationsInputSchema,
  SearchMedicationsOutputSchema,
  GetByCodeInputSchema,
  GetByCodeOutputSchema,
  ListPillboxInputSchema,
  ListPillboxOutputSchema,
  PatientMedicationDetailOutputSchema,
  CreatePatientMedicationInputSchema,
  UpdatePatientMedicationInputSchema,
  PatientMedicationOutputSchema,
  AddScheduleInputSchema,
  ScheduleOutputSchema,
  UpdateScheduleInputSchema,
  DeleteScheduleInputSchema,
  TodayPillboxOutputSchema,
  MarkIntakeInputSchema,
  IntakeOutputSchema,
  AdminListPillboxInputSchema,
  AdminListPillboxOutputSchema,
  AdminCreateMedicationInputSchema,
  AdminTodayInputSchema,
} from '../lib/medications/medications.schemas';
import { adminProcedure, patientProcedure, router } from '../middlewares';

export const medicationsRouter = router({
  search: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/medications/search',
        summary: 'Search medications',
        description: 'Search the external medications database (BDPM) by name or active substance.',
        tags: ['Medications'],
      },
    })
    .input(SearchMedicationsInputSchema)
    .output(SearchMedicationsOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.search(input);
    }),

  getByCode: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/medications/by-code',
        summary: 'Get medication by code',
        description:
          'Retrieve a specific medication from the external database by CIS, CIP, or external ID.',
        tags: ['Medications'],
      },
    })
    .input(GetByCodeInputSchema)
    .output(GetByCodeOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.getByCode(input);
    }),
});

export const pillboxRouter = router({
  listMine: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/pillbox',
        summary: 'List my medications',
        description:
          'Returns a paginated list of the authenticated patient medications with optional active filter.',
        tags: ['Pillbox'],
      },
    })
    .input(ListPillboxInputSchema)
    .output(ListPillboxOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.listMine(session.userId, input);
    }),

  today: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/pillbox/today',
        summary: 'Get today pillbox',
        description:
          'Returns all medication intakes scheduled for today, auto-generating intake records as needed.',
        tags: ['Pillbox'],
      },
    })
    .input(z.object({}))
    .output(TodayPillboxOutputSchema)
    .query(async ({ ctx: { session, services } }) => {
      return await services.medicationsService.today(session.userId);
    }),

  detail: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/pillbox/{id}',
        summary: 'Get medication detail',
        description:
          'Returns the detail of a patient medication including its schedules. The caller must be the owner or an admin.',
        tags: ['Pillbox'],
      },
    })
    .input(z.object({ id: z.uuid() }))
    .output(PatientMedicationDetailOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      const isAdmin = session.role === 'admin';
      return await services.medicationsService.detail(session.userId, input.id, isAdmin);
    }),

  createMedication: patientProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/pillbox',
        summary: 'Add a medication to pillbox',
        description:
          'Adds a new medication to the patient pillbox with at least one intake schedule.',
        tags: ['Pillbox'],
      },
    })
    .input(CreatePatientMedicationInputSchema)
    .output(PatientMedicationDetailOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.createMedication(session.userId, input);
    }),

  updateMedication: patientProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/api/pillbox/{id}',
        summary: 'Update a medication',
        description:
          'Updates dosage, instructions, dates, or active status of a patient medication.',
        tags: ['Pillbox'],
      },
    })
    .input(UpdatePatientMedicationInputSchema)
    .output(PatientMedicationOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.updateMedication(session.userId, input);
    }),

  deleteMedication: patientProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/api/pillbox/{id}',
        summary: 'Delete a medication',
        description:
          'Removes a medication and all its schedules and intakes from the patient pillbox.',
        tags: ['Pillbox'],
      },
    })
    .input(z.object({ id: z.uuid() }))
    .output(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.deleteMedication(session.userId, input.id);
    }),

  addSchedule: patientProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/pillbox/schedules',
        summary: 'Add an intake schedule',
        description: 'Adds a new intake schedule to an existing patient medication.',
        tags: ['Pillbox'],
      },
    })
    .input(AddScheduleInputSchema)
    .output(ScheduleOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.addSchedule(
        session.userId,
        input,
        session.role === 'admin',
      );
    }),

  updateSchedule: patientProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/api/pillbox/schedules/{id}',
        summary: 'Update an intake schedule',
        description: 'Updates time, moment, quantity, or weekday of an intake schedule.',
        tags: ['Pillbox'],
      },
    })
    .input(UpdateScheduleInputSchema)
    .output(ScheduleOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.updateSchedule(
        session.userId,
        input,
        session.role === 'admin',
      );
    }),

  deleteSchedule: patientProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/api/pillbox/schedules/{id}',
        summary: 'Delete an intake schedule',
        description: 'Removes an intake schedule from a patient medication.',
        tags: ['Pillbox'],
      },
    })
    .input(DeleteScheduleInputSchema)
    .output(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.deleteSchedule(
        session.userId,
        input.id,
        session.role === 'admin',
      );
    }),

  markIntakeTaken: patientProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/pillbox/intakes/{id}/taken',
        summary: 'Mark intake as taken',
        description: 'Marks a pending medication intake as taken with optional notes.',
        tags: ['Pillbox'],
      },
    })
    .input(MarkIntakeInputSchema)
    .output(IntakeOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.markIntakeTaken(
        session.userId,
        input.id,
        input.notes,
      );
    }),

  markIntakeSkipped: patientProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/pillbox/intakes/{id}/skipped',
        summary: 'Mark intake as skipped',
        description: 'Marks a pending medication intake as skipped with optional notes.',
        tags: ['Pillbox'],
      },
    })
    .input(MarkIntakeInputSchema)
    .output(IntakeOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.markIntakeSkipped(
        session.userId,
        input.id,
        input.notes,
      );
    }),

  // ─── Admin Procedures ──────────────────────────────

  adminListAll: adminProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/pillbox/admin',
        summary: 'List all patient medications (admin)',
        description: 'Admin endpoint to list all patient medications with optional filters.',
        tags: ['Pillbox Admin'],
      },
    })
    .input(AdminListPillboxInputSchema)
    .output(AdminListPillboxOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.adminListAll(input);
    }),

  adminCreateMedication: adminProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/pillbox/admin',
        summary: 'Create medication for a patient (admin)',
        description: 'Admin endpoint to add a medication to a specific patient pillbox.',
        tags: ['Pillbox Admin'],
      },
    })
    .input(AdminCreateMedicationInputSchema)
    .output(PatientMedicationDetailOutputSchema)
    .mutation(async ({ input, ctx: { services } }) => {
      const { patientId, ...medicationInput } = input;
      return await services.medicationsService.adminCreateMedication(patientId, medicationInput);
    }),

  adminUpdateMedication: adminProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/api/pillbox/admin/{id}',
        summary: 'Update medication (admin)',
        description: 'Admin endpoint to update any patient medication.',
        tags: ['Pillbox Admin'],
      },
    })
    .input(UpdatePatientMedicationInputSchema)
    .output(PatientMedicationOutputSchema)
    .mutation(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.adminUpdateMedication(input);
    }),

  adminDeleteMedication: adminProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/api/pillbox/admin/{id}',
        summary: 'Delete medication (admin)',
        description: 'Admin endpoint to remove any patient medication.',
        tags: ['Pillbox Admin'],
      },
    })
    .input(z.object({ id: z.uuid() }))
    .output(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.adminDeleteMedication(input.id);
    }),

  adminTodayByPatient: adminProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/pillbox/admin/today/{patientId}',
        summary: 'Get patient today pillbox (admin)',
        description: 'Admin endpoint to view a specific patient today schedule.',
        tags: ['Pillbox Admin'],
      },
    })
    .input(AdminTodayInputSchema)
    .output(TodayPillboxOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.medicationsService.adminTodayByPatient(input.patientId);
    }),
});
