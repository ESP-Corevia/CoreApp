import {
  AppointmentDetailInputSchema,
  AppointmentDetailOutputSchema,
  AppointmentOutputSchema,
  CreateAppointmentInputSchema,
  ListAppointmentsInputSchema,
  ListAppointmentsOutputSchema,
} from '../db/services/appointments.service';
import { patientProcedure, router } from '../middlewares';

export const appointmentsRouter = router({
  detail: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/appointments/{id}',
        summary: 'Get appointment detail',
        description:
          'Returns the detail of an appointment. The caller must be the patient owner or an admin.',
        tags: ['Appointments'],
      },
    })
    .input(AppointmentDetailInputSchema)
    .output(AppointmentDetailOutputSchema)
    .query(async ({ input, ctx: { session, services } }) => {
      const isAdmin = session.role === 'admin';
      return await services.appointmentsService.getAppointmentDetail(
        session.userId,
        input.id,
        isAdmin,
      );
    }),

  create: patientProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/appointments',
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

  listMine: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/appointments',
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
