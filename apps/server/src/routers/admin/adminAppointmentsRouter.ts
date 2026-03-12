import { z } from 'zod';

import { adminProcedure } from '../../middlewares';

export const listAppointments = adminProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/admin/appointments',
      summary: 'List all appointments',
      description: 'Returns a paginated list of all appointments with doctor and patient info.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      page: z.number().int().positive(),
      perPage: z.number().int().positive(),
      search: z.string().optional(),
      status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
      from: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD')
        .optional(),
      to: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD')
        .optional(),
      doctorId: z.uuid().optional(),
      sort: z.enum(['dateAsc', 'dateDesc', 'createdAtDesc']).default('dateDesc'),
    }),
  )
  .output(
    z.object({
      appointments: z.array(
        z.object({
          id: z.string(),
          doctorId: z.string(),
          patientId: z.string(),
          date: z.string(),
          time: z.string(),
          status: z.string(),
          reason: z.string().nullable(),
          createdAt: z.coerce.date(),
          doctorName: z.string().nullable(),
          patientName: z.string().nullable(),
        }),
      ),
      totalItems: z.number().int(),
      totalPages: z.number().int(),
      page: z.number().int(),
      perPage: z.number().int(),
    }),
  )
  .query(async ({ input, ctx }) => {
    return await ctx.services.appointmentsService.listAllAppointments({
      page: input.page,
      perPage: input.perPage,
      search: input.search,
      status: input.status,
      from: input.from,
      to: input.to,
      doctorId: input.doctorId,
      sort: input.sort,
    });
  });

export const updateAppointmentStatus = adminProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/admin/appointments/{id}/status',
      summary: 'Update appointment status',
      description:
        'Updates the status of an appointment. Valid transitions: PENDING->CONFIRMED/CANCELLED, CONFIRMED->COMPLETED/CANCELLED.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      doctorId: z.string(),
      patientId: z.string(),
      date: z.string(),
      time: z.string(),
      status: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    return await ctx.services.appointmentsService.updateAppointmentStatus(input.id, input.status);
  });
