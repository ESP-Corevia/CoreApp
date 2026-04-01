import { z } from 'zod';

import {
  AppointmentDetailInputSchema,
  AppointmentDetailOutputSchema,
  AppointmentOutputSchema,
  ListAppointmentsInputSchema,
  ListDoctorAppointmentsOutputSchema,
} from '../../db/services/appointments.service';
import { doctorProcedure, router } from '../../middlewares';

export const doctorAppointmentsRouter = router({
  listMine: doctorProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctor/appointments',
        summary: 'List my appointments (doctor)',
        description:
          'Returns a paginated list of appointments for the authenticated doctor with optional filters on status, date range, and sorting.',
        tags: ['Doctor Appointments'],
      },
    })
    .input(ListAppointmentsInputSchema)
    .output(ListDoctorAppointmentsOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      return await services.appointmentsService.listDoctorAppointments(session.userId, input);
    }),

  detail: doctorProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctor/appointments/{id}',
        summary: 'Get appointment detail (doctor)',
        description:
          'Returns the detail of an appointment. The caller must be the doctor assigned to this appointment.',
        tags: ['Doctor Appointments'],
      },
    })
    .input(AppointmentDetailInputSchema)
    .output(AppointmentDetailOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      return await services.appointmentsService.getDoctorAppointmentDetail(
        session.userId,
        input.id,
      );
    }),

  updateStatus: doctorProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/doctor/appointments/{id}/status',
        summary: 'Update appointment status (doctor)',
        description:
          'Allows the doctor to confirm (PENDING→CONFIRMED), complete (CONFIRMED→COMPLETED), or cancel (PENDING/CONFIRMED→CANCELLED) an appointment.',
        tags: ['Doctor Appointments'],
      },
    })
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']),
      }),
    )
    .output(AppointmentOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.appointmentsService.updateDoctorAppointmentStatus(
        session.userId,
        input.id,
        input.status,
      );
    }),
});
