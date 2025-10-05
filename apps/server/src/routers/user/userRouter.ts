import { z } from 'zod';

import { protectedProcedure, router } from '../../middlewares';

export const userRouter = router({
  getMe: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/me',
        summary: 'Get current user',
        description: 'Returns the current user information.',
        protect: true,
        tags: ['UserRouter'],
      },
    })
    .input(z.object({}))
    .output(
      z.object({
        user: z.any(),
      }),
    )
    .query(async ({ ctx: { services, session } }) => {
      const user = await services?.usersService.getMe(session.userId);
      return {
        user,
      };
    }),
});
