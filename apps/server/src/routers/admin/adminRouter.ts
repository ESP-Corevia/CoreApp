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
});
