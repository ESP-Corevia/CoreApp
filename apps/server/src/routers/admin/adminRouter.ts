import { z } from 'zod';

import { adminProcedure, router } from '../../middlewares';

export const adminRouter = router({
  isAdmin: adminProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/is-admin',
        summary: 'Check if user is admin',
        description: 'Returns whether the current user is an admin.',
        protect: true,
        tags: ['AdminRouter'],
      },
    })
    .input(z.object({}))
    .output(z.boolean())
    .query(() => {
      return true;
    }),
  listUsers: adminProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/list-users',
        summary: 'List all users',
        description: 'Returns a list of all users.',
        protect: true,
        tags: ['AdminRouter'],
      },
    })
    .input(
      z.object({
        page: z.number().int().positive(),
        perPage: z.number().int().positive(),

        search: z.string().optional(),
        searchInFields: z.array(z.string()).default(['email', 'name']),

        sorting: z
          .string()
          .transform((v) => JSON.parse(v))
          .optional(),
        filters: z
          .string()
          .transform((v) => JSON.parse(v))
          .optional(),
      }),
    )
    .output(
      z.object({
        users: z.array(
          z.object({
            id: z.string(),
            email: z.email(),
            name: z.string(),
            role: z.string().nullable(),
            createdAt: z.date(),
            updatedAt: z.date().nullable(),
            emailVerified: z.boolean(),
            image: z.string().nullable(),
            banned: z.boolean().nullable(),
            banReason: z.string().nullable().optional(),
            banExpires: z.date().nullable().optional(),
            lastLoginMethod: z.string().nullable().optional(),
          }),
        ),
        totalItems: z.number().int(),
        totalPages: z.number().int(),
        page: z.number().int(),
        perPage: z.number().int(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const res = await ctx.services.usersService.listUsers({
        params: {
          page: input.page,
          perPage: input.perPage,
          search: input.search,
          searchInFields: input.searchInFields as ('email' | 'name')[],
          sorting: input.sorting,
          filters: input.filters,
        },
        userId: ctx.session.userId,
      });
      return res;
    }),
});
