import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

import type { createUsersService } from '../src/db/services/users.service';

type UsersService = ReturnType<typeof createUsersService>;

export const mockUsersService: DeepMockProxy<UsersService> = mockDeep<UsersService>();

export const mockServices = {
  usersService: mockUsersService,
};
