import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  ListPillboxInputSchema,
  ListPillboxOutputSchema,
  PatientMedicationDetailOutputSchema,
  TodayPillboxOutputSchema,
} from '../../lib/medications/medications.schemas';
import { doctorProcedure, router } from '../../middlewares';

const DoctorPatientInputSchema = z.object({
  patientId: z.uuid(),
});

export const doctorPillboxRouter = router({
  listByPatient: doctorProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctor/pillbox/{patientId}',
        summary: 'List patient medications (doctor)',
        description:
          'Returns a paginated list of medications for a specific patient. The doctor must have at least one appointment with the patient.',
        tags: ['Doctor Pillbox'],
      },
    })
    .input(DoctorPatientInputSchema.merge(ListPillboxInputSchema))
    .output(ListPillboxOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      const hasRelationship = await services.appointmentsService.hasPatientRelationship(
        session.userId,
        input.patientId,
      );
      if (!hasRelationship) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this patient records',
        });
      }
      return await services.medicationsService.doctorListPatientPillbox(input.patientId, input);
    }),

  todayByPatient: doctorProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctor/pillbox/{patientId}/today',
        summary: 'Get patient today pillbox (doctor)',
        description:
          "Returns today's medication schedule for a specific patient. The doctor must have at least one appointment with the patient.",
        tags: ['Doctor Pillbox'],
      },
    })
    .input(DoctorPatientInputSchema)
    .output(TodayPillboxOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      const hasRelationship = await services.appointmentsService.hasPatientRelationship(
        session.userId,
        input.patientId,
      );
      if (!hasRelationship) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this patient records',
        });
      }
      return await services.medicationsService.doctorViewPatientToday(input.patientId);
    }),

  medicationDetail: doctorProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctor/pillbox/medication/{id}',
        summary: 'Get medication detail (doctor)',
        description:
          'Returns the detail of a patient medication including its schedules. The doctor must have a relationship with the patient.',
        tags: ['Doctor Pillbox'],
      },
    })
    .input(z.object({ id: z.uuid() }))
    .output(PatientMedicationDetailOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      const med = await services.medicationsService.doctorViewMedicationDetail(input.id);
      const hasRelationship = await services.appointmentsService.hasPatientRelationship(
        session.userId,
        med.patientId,
      );
      if (!hasRelationship) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this patient records',
        });
      }
      return med;
    }),
});
