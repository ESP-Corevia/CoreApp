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

export const createAppointment = adminProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/admin/appointments',
      summary: 'Create an appointment',
      description: 'Admin creates an appointment on behalf of a patient.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      doctorId: z.string().uuid(),
      patientId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
      time: z.string().regex(/^\d{2}:\d{2}$/, 'time must be HH:mm'),
      reason: z.string().optional(),
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
    return await ctx.services.appointmentsService.adminCreateAppointment(input);
  });

export const updateAppointment = adminProcedure
  .meta({
    openapi: {
      method: 'PUT',
      path: '/admin/appointments/{id}',
      summary: 'Update an appointment',
      description: 'Admin updates appointment fields (date, time, reason, doctorId, patientId).',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      id: z.string().uuid(),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
        .optional(),
      time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'time must be HH:mm')
        .optional(),
      reason: z.string().optional(),
      doctorId: z.string().uuid().optional(),
      patientId: z.string().uuid().optional(),
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
      reason: z.string().nullable(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    return await ctx.services.appointmentsService.adminUpdateAppointment(id, data);
  });

export const deleteAppointment = adminProcedure
  .meta({
    openapi: {
      method: 'DELETE',
      path: '/admin/appointments/{id}',
      summary: 'Delete an appointment',
      description: 'Admin deletes an appointment.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      id: z.string().uuid(),
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
    return await ctx.services.appointmentsService.adminDeleteAppointment(input.id);
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
