import { db } from '../index';

import { createUsersRepo } from './users.repository';

export const usersRepo = createUsersRepo(db);

export type Repositories = {
  usersRepo: ReturnType<typeof createUsersRepo>;
};
