import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

import type { createAppointmentsService } from '../src/db/services/appointments.service';
import type { createAvailabilityService } from '../src/db/services/availability.service';
import type { createDoctorsService } from '../src/db/services/doctors.service';
import type { createMedicationsService } from '../src/db/services/medications.service';
import type { createPatientsService } from '../src/db/services/patients.service';
import type { createUsersService } from '../src/db/services/users.service';

type UsersService = ReturnType<typeof createUsersService>;
type DoctorsService = ReturnType<typeof createDoctorsService>;
type PatientsService = ReturnType<typeof createPatientsService>;
type AvailabilityService = ReturnType<typeof createAvailabilityService>;
type AppointmentsService = ReturnType<typeof createAppointmentsService>;
type MedicationsService = ReturnType<typeof createMedicationsService>;

export const mockUsersService: DeepMockProxy<UsersService> = mockDeep<UsersService>();
export const mockDoctorsService: DeepMockProxy<DoctorsService> = mockDeep<DoctorsService>();
export const mockPatientsService: DeepMockProxy<PatientsService> = mockDeep<PatientsService>();
export const mockAvailabilityService: DeepMockProxy<AvailabilityService> =
  mockDeep<AvailabilityService>();
export const mockAppointmentsService: DeepMockProxy<AppointmentsService> =
  mockDeep<AppointmentsService>();
export const mockMedicationsService: DeepMockProxy<MedicationsService> =
  mockDeep<MedicationsService>();

export const mockServices = {
  usersService: mockUsersService,
  doctorsService: mockDoctorsService,
  patientsService: mockPatientsService,
  availabilityService: mockAvailabilityService,
  appointmentsService: mockAppointmentsService,
  medicationsService: mockMedicationsService,
};
