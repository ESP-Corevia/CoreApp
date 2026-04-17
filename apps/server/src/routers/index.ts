import { protectedProcedure, publicProcedure, router } from '../middlewares';

import { adminRouter } from './admin/adminRouter';
import { doctorRouter } from './doctor/doctorRouter';
import { helloWorldRouter } from './helloworld';
import { patientAppointmentsRouter } from './patient/appointmentsRouter';
import { patientDoctorsRouter } from './patient/doctorsRouter';
import { patientDocumentsRouter } from './patient/documentsRouter';
import { patientMedicationsRouter } from './patient/medicationsRouter';
import { patientPillboxRouter } from './patient/pillboxRouter';
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
  doctors: patientDoctorsRouter,
  appointments: patientAppointmentsRouter,
  medications: patientMedicationsRouter,
  pillbox: patientPillboxRouter,
  doctor: doctorRouter,
  document: patientDocumentsRouter,
});
export type AppRouter = typeof appRouter;
