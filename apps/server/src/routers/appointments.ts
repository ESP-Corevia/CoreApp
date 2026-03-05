import {
  AppointmentOutputSchema,
  CreateAppointmentInputSchema,
  ListAppointmentsInputSchema,
  ListAppointmentsOutputSchema,
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

  listMine: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/appointments',
        summary: 'List my appointments',
        description:
          'Returns a paginated list of appointments for the authenticated user with optional filters on status, date range, and sorting.',
        tags: ['Appointments'],
      },
    })
    .input(ListAppointmentsInputSchema)
    .output(ListAppointmentsOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      return await services.appointmentsService.listMyAppointments(session.userId, input);
    }),
});
