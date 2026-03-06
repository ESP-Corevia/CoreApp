import { protectedProcedure, publicProcedure, router } from '../middlewares';

import { adminRouter } from './admin/adminRouter';
import { helloWorldRouter } from './helloworld';
import { userRouter } from './user/userRouter';
export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return 'OK';
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: 'This is private',
      user: ctx.session.userId,
    };
  }),
  helloWorld: helloWorldRouter,
  user: userRouter,
  admin: adminRouter,
});
export type AppRouter = typeof appRouter;
