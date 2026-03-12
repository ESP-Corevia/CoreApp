import { z } from 'zod';

import { adminProcedure } from '../../middlewares';

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
      perPage: z.number().int().positive(),
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
