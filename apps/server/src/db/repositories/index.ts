import { db } from '../index';

import { createAppointmentsRepo } from './appointments.repository';
import { createAvailabilityRepo } from './availability.repository';
import { createDoctorsRepo } from './doctors.repository';
import { createUsersRepo } from './users.repository';

export const usersRepo = createUsersRepo(db);
export const doctorsRepo = createDoctorsRepo(db);
export const availabilityRepo = createAvailabilityRepo(db);
export const appointmentsRepo = createAppointmentsRepo(db);

export type Repositories = {
  usersRepo: ReturnType<typeof createUsersRepo>;
  doctorsRepo: ReturnType<typeof createDoctorsRepo>;
  availabilityRepo: ReturnType<typeof createAvailabilityRepo>;
  appointmentsRepo: ReturnType<typeof createAppointmentsRepo>;
};
