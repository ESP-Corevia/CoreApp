import { usersRepo } from '../repositories';

import { createUsersService } from './users.service';

export const usersService = createUsersService(usersRepo);
export const services = {
  usersService,
};
export type Services = {
  usersService: ReturnType<typeof createUsersService>;
};
