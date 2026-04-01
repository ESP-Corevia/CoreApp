import { z } from 'zod';

import {
  AdminCreateMedicationInputSchema,
  AdminListPillboxInputSchema,
  AdminListPillboxOutputSchema,
  AdminTodayInputSchema,
  PatientMedicationDetailOutputSchema,
  PatientMedicationOutputSchema,
  TodayPillboxOutputSchema,
  UpdatePatientMedicationInputSchema,
} from '../../lib/medications/medications.schemas';
import { adminProcedure } from '../../middlewares';

export const adminListPillbox = adminProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/admin/pillbox',
      summary: 'List all patient medications (admin)',
      description: 'Admin endpoint to list all patient medications with optional filters.',
      tags: ['Pillbox Admin'],
    },
  })
  .input(AdminListPillboxInputSchema)
  .output(AdminListPillboxOutputSchema)
  .query(async ({ input, ctx: { services } }) => {
    return await services.medicationsService.adminListAll(input);
  });

export const adminCreateMedication = adminProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/admin/pillbox',
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
  });

export const adminUpdateMedication = adminProcedure
  .meta({
    openapi: {
      method: 'PATCH',
      path: '/admin/pillbox/{id}',
      summary: 'Update medication (admin)',
      description: 'Admin endpoint to update any patient medication.',
      tags: ['Pillbox Admin'],
    },
  })
  .input(UpdatePatientMedicationInputSchema)
  .output(PatientMedicationOutputSchema)
  .mutation(async ({ input, ctx: { services } }) => {
    return await services.medicationsService.adminUpdateMedication(input);
  });

export const adminDeleteMedication = adminProcedure
  .meta({
    openapi: {
      method: 'DELETE',
      path: '/admin/pillbox/{id}',
      summary: 'Delete medication (admin)',
      description: 'Admin endpoint to remove any patient medication.',
      tags: ['Pillbox Admin'],
    },
  })
  .input(z.object({ id: z.uuid() }))
  .output(z.object({ id: z.uuid() }))
  .mutation(async ({ input, ctx: { services } }) => {
    return await services.medicationsService.adminDeleteMedication(input.id);
  });

export const adminTodayByPatient = adminProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/admin/pillbox/today/{patientId}',
      summary: 'Get patient today pillbox (admin)',
      description: 'Admin endpoint to view a specific patient today schedule.',
      tags: ['Pillbox Admin'],
    },
  })
  .input(AdminTodayInputSchema)
  .output(TodayPillboxOutputSchema)
  .query(async ({ input, ctx: { services } }) => {
    return await services.medicationsService.adminTodayByPatient(input.patientId);
  });
