import { protectedProcedure, publicProcedure, router } from '../middlewares';

import { helloWorldRouter } from './helloworld';
export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return 'OK';
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: 'This is private',
      user: ctx.session.user,
    };
  }),
  helloWorld: helloWorldRouter,
});
export type AppRouter = typeof appRouter;
