import {
  appointmentsRepo,
  availabilityRepo,
  doctorsRepo,
  patientsRepo,
  usersRepo,
} from '../repositories';

import { createAppointmentsService } from './appointments.service';
import { createAvailabilityService } from './availability.service';
import { createDoctorsService } from './doctors.service';
import { createPatientsService } from './patients.service';
import { createUsersService } from './users.service';

export const usersService = createUsersService(usersRepo);
export const doctorsService = createDoctorsService(doctorsRepo);
export const patientsService = createPatientsService(patientsRepo);
export const availabilityService = createAvailabilityService(availabilityRepo);
export const appointmentsService = createAppointmentsService(appointmentsRepo);
export const services = {
  usersService,
  doctorsService,
  patientsService,
  availabilityService,
  appointmentsService,
};
export type Services = {
  usersService: ReturnType<typeof createUsersService>;
  doctorsService: ReturnType<typeof createDoctorsService>;
  patientsService: ReturnType<typeof createPatientsService>;
  availabilityService: ReturnType<typeof createAvailabilityService>;
  appointmentsService: ReturnType<typeof createAppointmentsService>;
};
