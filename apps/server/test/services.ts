import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

import type { createAiMetricsService } from '../src/db/services/aiMetrics.service';
import type { createUsersService } from '../src/db/services/users.service';

type AiMetricsService = ReturnType<typeof createAiMetricsService>;
type UsersService = ReturnType<typeof createUsersService>;

export const mockUsersService: DeepMockProxy<UsersService> = mockDeep<UsersService>();
export const mockAiMetricsService: DeepMockProxy<AiMetricsService> = mockDeep<AiMetricsService>();

export const mockServices = {
  usersService: mockUsersService,
  aiMetricsService: mockAiMetricsService,
};
