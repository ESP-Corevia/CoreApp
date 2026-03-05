import {
  AppointmentDetailInputSchema,
  AppointmentDetailOutputSchema,
  AppointmentOutputSchema,
  CreateAppointmentInputSchema,
  ListAppointmentsInputSchema,
  ListAppointmentsOutputSchema,
} from '../db/services/appointments.service';
import { ALL_PERMISSIONS } from '../lib/permissions';
import { protectedProcedure, router } from '../middlewares';

export const appointmentsRouter = router({
  detail: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/appointments/{id}',
        summary: 'Get appointment detail',
        description:
          'Returns the detail of an appointment. The caller must be the patient owner or an admin.',
        tags: ['Appointments'],
      },
    })
    .input(AppointmentDetailInputSchema)
    .output(AppointmentDetailOutputSchema)
    .query(async ({ input, ctx: { session, services, auth } }) => {
      const { success: isAdmin } = await auth.api.userHasPermission({
        body: { userId: session.userId, role: 'admin', permission: ALL_PERMISSIONS },
      });
      return await services.appointmentsService.getAppointmentDetail(
        session.userId,
        input.id,
        isAdmin,
      );
    }),

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
