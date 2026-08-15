import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../src/app';
import { services } from '../../src/db/services';
import type { auth as authInstance } from '../../src/lib/auth';

// `vi.mock` is hoisted above these imports, so every module below resolves the
// database through the PGlite double.
vi.mock('../../src/db', () => import('./db.mock'));

/**
 * Failure handling of the HTTP surface itself: when better-auth blows up, the API must answer a
 * controlled 500 instead of leaking a stack trace or hanging the request.
 */
describe('integration: http surface resilience', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  async function buildWithFailingAuth(error: Error): Promise<FastifyInstance> {
    // Test seam: only `handler` and `api.getSession` are reached by the routes under test.
    const failingAuth = {
      handler: vi.fn().mockRejectedValue(error),
      api: { getSession: vi.fn().mockResolvedValue(null) },
    } as unknown as typeof authInstance;

    const built = await buildApp({ auth: failingAuth, services, logger: false });
    await built.ready();
    return built;
  }

  it('answers AUTH_FAILURE when the auth handler throws', async () => {
    app = await buildWithFailingAuth(new Error('identity provider unreachable'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      headers: { host: 'localhost:3000', 'content-type': 'application/json' },
      payload: { email: 'someone@corevia.test', password: 'Sup3rSecret!' },
    });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: 'Internal authentication error',
      code: 'AUTH_FAILURE',
    });
  });

  it('does not leak the underlying error message to the client', async () => {
    app = await buildWithFailingAuth(new Error('postgres password authentication failed'));

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { host: 'localhost:3000' },
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).not.toContain('postgres password');
  });

  it('rejects an unsupported method on the auth route', async () => {
    app = await buildWithFailingAuth(new Error('unused'));

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/auth/sign-out',
      headers: { host: 'localhost:3000' },
    });

    expect(res.statusCode).toBe(404);
  });
});
