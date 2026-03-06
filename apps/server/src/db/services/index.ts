import { doctorsRepo, usersRepo } from '../repositories';

import { createDoctorsService } from './doctors.service';
import { createUsersService } from './users.service';

export const usersService = createUsersService(usersRepo);
export const doctorsService = createDoctorsService(doctorsRepo);
export const services = {
  usersService,
  doctorsService,
};
export type Services = {
  usersService: ReturnType<typeof createUsersService>;
  doctorsService: ReturnType<typeof createDoctorsService>;
};
