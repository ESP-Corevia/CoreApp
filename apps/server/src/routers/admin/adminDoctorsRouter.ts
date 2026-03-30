import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure } from '../../middlewares';
import { MAX_ADMIN_PER_PAGE } from './constants';

export const createDoctor = adminProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/admin/doctors',
      summary: 'Create a doctor profile',
      description: 'Admin creates a doctor profile for an existing user with role "doctor".',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      userId: z.uuid(),
      specialty: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      userId: z.string().nullable(),
      specialty: z.string(),
      address: z.string(),
      city: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { userId, ...data } = input;
    return await ctx.services.doctorsService.createProfile(userId, data);
  });

export const updateDoctor = adminProcedure
  .meta({
    openapi: {
      method: 'PUT',
      path: '/admin/doctors/{userId}',
      summary: 'Update a doctor profile',
      description: 'Admin updates a doctor profile (specialty, address, city).',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      userId: z.uuid(),
      specialty: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      userId: z.string().nullable(),
      specialty: z.string(),
      address: z.string(),
      city: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { userId, ...data } = input;
    try {
      const updated = await ctx.services.doctorsService.updateProfile(userId, data);
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Doctor profile not found' });
      }
      return updated;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update doctor profile',
        cause: error,
      });
    }
  });

export const listDoctors = adminProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/admin/doctors',
      summary: 'List all doctors',
      description: 'Returns a paginated list of all doctors with user info.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      page: z.number().int().positive(),
      perPage: z.number().int().positive().max(MAX_ADMIN_PER_PAGE),
      search: z.string().optional(),
      specialty: z.string().optional(),
      city: z.string().optional(),
    }),
  )
  .output(
    z.object({
      doctors: z.array(
        z.object({
          id: z.string(),
          userId: z.string().nullable(),
          specialty: z.string(),
          address: z.string(),
          city: z.string(),
          name: z.string().nullable(),
          email: z.string().nullable(),
          image: z.string().nullable(),
        }),
      ),
      totalItems: z.number().int(),
      totalPages: z.number().int(),
      page: z.number().int(),
      perPage: z.number().int(),
    }),
  )
  .query(async ({ input, ctx }) => {
    return await ctx.services.doctorsService.listAllAdmin({
      page: input.page,
      perPage: input.perPage,
      search: input.search,
      specialty: input.specialty,
      city: input.city,
    });
  });
