import { router } from '../../middlewares';

import { doctorAppointmentsRouter } from './doctorAppointmentsRouter';
import { doctorMedicationsRouter } from './doctorMedicationsRouter';
import { doctorPillboxRouter } from './doctorPillboxRouter';

export const doctorRouter = router({
  appointments: doctorAppointmentsRouter,
  medications: doctorMedicationsRouter,
  pillbox: doctorPillboxRouter,
});
