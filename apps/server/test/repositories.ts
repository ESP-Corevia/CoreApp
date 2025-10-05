import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

import type { createUsersRepo } from '../src/db/repositories/users.repository';

type UserRepo = ReturnType<typeof createUsersRepo>;

export const mockUserRepo: DeepMockProxy<UserRepo> = mockDeep<UserRepo>();

// ts-prune-ignore-next
export const mockRepositories = {
  usersRepo: mockUserRepo,
};
