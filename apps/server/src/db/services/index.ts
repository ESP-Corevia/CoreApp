import { availabilityRepo, doctorsRepo, usersRepo } from '../repositories';

import { createAvailabilityService } from './availability.service';
import { createDoctorsService } from './doctors.service';
import { createUsersService } from './users.service';

export const usersService = createUsersService(usersRepo);
export const doctorsService = createDoctorsService(doctorsRepo);
export const availabilityService = createAvailabilityService(availabilityRepo);
export const services = {
  usersService,
  doctorsService,
  availabilityService,
};
export type Services = {
  usersService: ReturnType<typeof createUsersService>;
  doctorsService: ReturnType<typeof createDoctorsService>;
  availabilityService: ReturnType<typeof createAvailabilityService>;
};
