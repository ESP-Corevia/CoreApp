import { afterEach, vi } from 'vitest';

/**
 * Environment variables come from `test.env` in `vitest.config.ts` so every suite — unit and
 * integration — runs against the real `src/env` module with deterministic values. Stubbing the
 * env module here used to leave most variables `undefined`, which silently disabled parts of the
 * configuration under test (CORS origins, auth secret, S3 settings).
 */
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
