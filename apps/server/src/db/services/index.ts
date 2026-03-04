import { usersRepo } from '../repositories';

import { createAiMetricsService } from './aiMetrics.service';
import { createUsersService } from './users.service';

export const usersService = createUsersService(usersRepo);
export const aiMetricsService = createAiMetricsService();
export const services = {
  usersService,
  aiMetricsService,
};
export type Services = {
  usersService: ReturnType<typeof createUsersService>;
  aiMetricsService: ReturnType<typeof createAiMetricsService>;
};
