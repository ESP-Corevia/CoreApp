import { db } from '../index';

import { createDoctorsRepo } from './doctors.repository';
import { createUsersRepo } from './users.repository';

export const usersRepo = createUsersRepo(db);
export const doctorsRepo = createDoctorsRepo(db);

export type Repositories = {
  usersRepo: ReturnType<typeof createUsersRepo>;
  doctorsRepo: ReturnType<typeof createDoctorsRepo>;
};
