import { z } from 'zod';

import {
  AddScheduleInputSchema,
  CreatePatientMedicationInputSchema,
  DeleteScheduleInputSchema,
  IntakeHistoryInputSchema,
  IntakeHistoryOutputSchema,
  IntakeOutputSchema,
  ListPillboxInputSchema,
  ListPillboxOutputSchema,
  MarkIntakeInputSchema,
  PatientMedicationDetailOutputSchema,
  PatientMedicationOutputSchema,
  ScheduleOutputSchema,
  TodayPillboxOutputSchema,
  UpdatePatientMedicationInputSchema,
  UpdateScheduleInputSchema,
} from '../../lib/medications/medications.schemas';
import { patientProcedure, router } from '../../middlewares';

export const patientPillboxRouter = router({
  listMine: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/pillbox',
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
        path: '/pillbox/today',
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
  intakeHistory: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/pillbox/history',
        summary: 'Get intake history by date range',
        description:
          'Returns a boolean per day indicating whether all intakes were taken (true) or any were pending/skipped (false).',
        tags: ['Pillbox'],
      },
    })
    .input(IntakeHistoryInputSchema)
    .output(IntakeHistoryOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      return await services.medicationsService.intakeHistory(session.userId, input.from, input.to);
    }),
  detail: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/pillbox/{id}',
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
        path: '/pillbox',
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
        path: '/pillbox/{id}',
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
        path: '/pillbox/{id}',
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
        path: '/pillbox/schedules',
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
        path: '/pillbox/schedules/{id}',
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
        path: '/pillbox/schedules/{id}',
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
        path: '/pillbox/intakes/{id}/taken',
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
        path: '/pillbox/intakes/{id}/skipped',
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
});
