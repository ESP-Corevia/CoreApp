import {
  AppointmentOutputSchema,
  CreateAppointmentInputSchema,
} from '../db/services/appointments.service';
import { protectedProcedure, router } from '../middlewares';

export const appointmentsRouter = router({
  create: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/api/appointments',
        summary: 'Create an appointment request',
        description:
          'Creates a new appointment request for the authenticated user. The slot must be in the future, not blocked, and not already booked.',
        tags: ['Appointments'],
      },
    })
    .input(CreateAppointmentInputSchema)
    .output(AppointmentOutputSchema)
    .mutation(async ({ input, ctx: { session, services } }) => {
      return await services.appointmentsService.createAppointment(session.userId, input);
    }),
});
