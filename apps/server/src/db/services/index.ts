import { createMedicationsProvider } from '../../lib/medications/api-medicaments-fr.client';
import { createStorageService } from '../../lib/storage';
import {
  appointmentsRepo,
  availabilityRepo,
  doctorsRepo,
  documentsRepo,
  medicationsRepo,
  patientsRepo,
  usersRepo,
} from '../repositories';
import { createAiMetricsService } from './aiMetrics.service';
import { createAppointmentsService } from './appointments.service';
import { createAvailabilityService } from './availability.service';
import { createDoctorsService } from './doctors.service';
import { createDocumentsService } from './documents.service';
import { createMedicationsService } from './medications.service';
import { createPatientsService } from './patients.service';
import { createUsersService } from './users.service';

const medicationsProvider = createMedicationsProvider();
const storageService = createStorageService();

export const usersService = createUsersService(usersRepo);
export const aiMetricsService = createAiMetricsService();
export const doctorsService = createDoctorsService(doctorsRepo, usersRepo);
export const patientsService = createPatientsService(patientsRepo, usersRepo);
export const availabilityService = createAvailabilityService(availabilityRepo, doctorsRepo);
export const appointmentsService = createAppointmentsService(appointmentsRepo);
export const medicationsService = createMedicationsService(medicationsRepo, medicationsProvider);
export const documentsService = createDocumentsService(documentsRepo, storageService);
export const services = {
  usersService,
  aiMetricsService,
  doctorsService,
  patientsService,
  availabilityService,
  appointmentsService,
  medicationsService,
  documentsService,
};
export type Services = {
  usersService: ReturnType<typeof createUsersService>;
  aiMetricsService: ReturnType<typeof createAiMetricsService>;
  doctorsService: ReturnType<typeof createDoctorsService>;
  patientsService: ReturnType<typeof createPatientsService>;
  availabilityService: ReturnType<typeof createAvailabilityService>;
  appointmentsService: ReturnType<typeof createAppointmentsService>;
  medicationsService: ReturnType<typeof createMedicationsService>;
  documentsService: ReturnType<typeof createDocumentsService>;
};
