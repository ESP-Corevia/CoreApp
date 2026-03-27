import { createMedicationsProvider } from '../../lib/medications/api-medicaments-fr.client';
import {
  appointmentsRepo,
  availabilityRepo,
  doctorsRepo,
  medicationsRepo,
  patientsRepo,
  usersRepo,
} from '../repositories';

import { createAppointmentsService } from './appointments.service';
import { createAvailabilityService } from './availability.service';
import { createDoctorsService } from './doctors.service';
import { createMedicationsService } from './medications.service';
import { createPatientsService } from './patients.service';
import { createUsersService } from './users.service';

const medicationsProvider = createMedicationsProvider();

export const usersService = createUsersService(usersRepo);
export const doctorsService = createDoctorsService(doctorsRepo);
export const patientsService = createPatientsService(patientsRepo);
export const availabilityService = createAvailabilityService(availabilityRepo, doctorsRepo);
export const appointmentsService = createAppointmentsService(appointmentsRepo);
export const medicationsService = createMedicationsService(medicationsRepo, medicationsProvider);
export const services = {
  usersService,
  doctorsService,
  patientsService,
  availabilityService,
  appointmentsService,
  medicationsService,
};
export type Services = {
  usersService: ReturnType<typeof createUsersService>;
  doctorsService: ReturnType<typeof createDoctorsService>;
  patientsService: ReturnType<typeof createPatientsService>;
  availabilityService: ReturnType<typeof createAvailabilityService>;
  appointmentsService: ReturnType<typeof createAppointmentsService>;
  medicationsService: ReturnType<typeof createMedicationsService>;
};
