import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

import type { createAppointmentsService } from '../src/db/services/appointments.service';
import type { createAvailabilityService } from '../src/db/services/availability.service';
import type { createDoctorsService } from '../src/db/services/doctors.service';
import type { createUsersService } from '../src/db/services/users.service';

type UsersService = ReturnType<typeof createUsersService>;
type DoctorsService = ReturnType<typeof createDoctorsService>;
type AvailabilityService = ReturnType<typeof createAvailabilityService>;
type AppointmentsService = ReturnType<typeof createAppointmentsService>;

export const mockUsersService: DeepMockProxy<UsersService> = mockDeep<UsersService>();
export const mockDoctorsService: DeepMockProxy<DoctorsService> = mockDeep<DoctorsService>();
export const mockAvailabilityService: DeepMockProxy<AvailabilityService> =
  mockDeep<AvailabilityService>();
export const mockAppointmentsService: DeepMockProxy<AppointmentsService> =
  mockDeep<AppointmentsService>();

export const mockServices = {
  usersService: mockUsersService,
  doctorsService: mockDoctorsService,
  availabilityService: mockAvailabilityService,
  appointmentsService: mockAppointmentsService,
};
