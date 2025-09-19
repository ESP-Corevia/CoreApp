import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

// import { setLogger } from '../src/lib/logger';

// import type { FastifyBaseLogger } from 'fastify';

// export const mockLogger = mockDeep<FastifyBaseLogger>();
beforeAll(() => {
  //   setLogger(mockLogger);
  vi.mock('../src/env', () => ({
    env: {
      NODE_ENV: 'test',
      SESSION_SECRET: 'test_session_secret',
      BASE_URL: 'http://localhost:3000',
    },
  }));
});

afterEach(() => {
  //   mockReset(mockLogger);
  // resetRateLimit();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
afterAll(() => {});
