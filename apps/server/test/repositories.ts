import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

import type { createAvailabilityRepo } from '../src/db/repositories/availability.repository';
import type { createDoctorsRepo } from '../src/db/repositories/doctors.repository';
import type { createUsersRepo } from '../src/db/repositories/users.repository';

type UserRepo = ReturnType<typeof createUsersRepo>;
type DoctorsRepo = ReturnType<typeof createDoctorsRepo>;
type AvailabilityRepo = ReturnType<typeof createAvailabilityRepo>;

export const mockUserRepo: DeepMockProxy<UserRepo> = mockDeep<UserRepo>();
export const mockDoctorsRepo: DeepMockProxy<DoctorsRepo> = mockDeep<DoctorsRepo>();
export const mockAvailabilityRepo: DeepMockProxy<AvailabilityRepo> = mockDeep<AvailabilityRepo>();

// ts-prune-ignore-next
export const mockRepositories = {
  usersRepo: mockUserRepo,
  doctorsRepo: mockDoctorsRepo,
  availabilityRepo: mockAvailabilityRepo,
};
