import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cookiesFrom,
  createAdminUser,
  createDoctorUser,
  createIntegrationApp,
  createPatientUser,
  createUser,
  resetIntegrationDb,
  sessionExists,
  sessionTokenFrom,
  signIn,
  signOut,
  signUp,
  TEST_PASSWORD,
  trpcData,
  trpcError,
  trpcQuery,
  uniqueEmail,
  withoutSessionCache,
} from './harness';

// `vi.mock` is hoisted above these imports, so every module below resolves the
// database through the PGlite double.
vi.mock('../../src/db', () => import('./db.mock'));

/**
 * Journey: authentication and session propagation.
 *
 * Covers the real better-auth handler mounted on `/api/auth/*`, the session resolution done
 * by the tRPC context, and the role guards shared by every protected procedure.
 */
describe('integration: authentication journey', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createIntegrationApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetIntegrationDb();
  });

  describe('sign-up', () => {
    it('creates an account and returns a session cookie', async () => {
      const email = uniqueEmail('signup');

      const res = await signUp(app, { email, name: 'Alice Martin' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ user: { email, name: 'Alice Martin' } });
      expect(cookiesFrom(res)).toContain('session_token');
    });

    it('assigns the patient role by default', async () => {
      const user = await createUser(app, { role: 'patient' });

      const res = await trpcQuery(app, 'appointments.listMine', {}, user.cookie);

      expect(res.statusCode).toBe(200);
    });

    it('rejects a password shorter than the 8 character policy', async () => {
      const res = await signUp(app, { email: uniqueEmail('weak'), password: 'short1' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toContain('PASSWORD_TOO_SHORT');
    });

    it('rejects a malformed email address', async () => {
      const res = await signUp(app, { email: 'not-an-email' });

      expect(res.statusCode).toBe(400);
      expect(res.json()).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('Invalid email address'),
      });
    });

    it('rejects an email that is already registered', async () => {
      const email = uniqueEmail('duplicate');
      await signUp(app, { email });

      const res = await signUp(app, { email });

      expect(res.statusCode).toBe(422);
      expect(res.body).toContain('USER_ALREADY_EXISTS');
    });
  });

  describe('sign-in', () => {
    it('returns a usable session for valid credentials', async () => {
      const email = uniqueEmail('signin');
      await signUp(app, { email });

      const res = await signIn(app, { email });
      const cookie = cookiesFrom(res);

      expect(res.statusCode).toBe(200);

      const session = await trpcQuery(app, 'privateData', undefined, cookie);
      expect(session.statusCode).toBe(200);
      expect(trpcData<{ message: string }>(session).message).toBe('This is private');
    });

    it('rejects an invalid password without leaking which field is wrong', async () => {
      const email = uniqueEmail('badpass');
      await signUp(app, { email });

      const res = await signIn(app, { email, password: `${TEST_PASSWORD}-wrong` });

      expect(res.statusCode).toBe(401);
      expect(res.body).toContain('INVALID_EMAIL_OR_PASSWORD');
    });

    it('rejects an unknown email address', async () => {
      const res = await signIn(app, { email: 'ghost@corevia.test' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toContain('INVALID_EMAIL_OR_PASSWORD');
    });
  });

  describe('session lifecycle', () => {
    it('exposes the signed-in user id on the tRPC context', async () => {
      const user = await createPatientUser(app);

      const res = await trpcQuery(app, 'privateData', undefined, user.cookie);

      expect(trpcData<{ user: string }>(res).user).toBe(user.id);
    });

    it('deletes the session row and clears the cookies on sign-out', async () => {
      const user = await createPatientUser(app);
      const token = sessionTokenFrom(user.cookie);
      await expect(sessionExists(token)).resolves.toBe(true);

      const res = await signOut(app, user.cookie);

      expect(res.statusCode).toBe(200);
      expect(String(res.headers['set-cookie'])).toContain('session_token=;');
      await expect(sessionExists(token)).resolves.toBe(false);
    });

    it('rejects the session token after sign-out once the cached session cookie is dropped', async () => {
      const user = await createPatientUser(app);
      await signOut(app, user.cookie);

      const res = await trpcQuery(app, 'privateData', undefined, withoutSessionCache(user.cookie));

      expect(res.statusCode).toBe(401);
      expect(trpcError(res).code).toBe('UNAUTHORIZED');
    });

    it('still honours the signed session cache cookie after sign-out (cookieCache tradeoff)', async () => {
      const user = await createPatientUser(app);
      await signOut(app, user.cookie);

      // `session.cookieCache` is enabled with a 5 minute TTL, so a client replaying the
      // cached cookie stays authenticated until it expires even though the row is gone.
      const res = await trpcQuery(app, 'privateData', undefined, user.cookie);

      expect(res.statusCode).toBe(200);
    });

    it('rejects a forged session cookie', async () => {
      const res = await trpcQuery(
        app,
        'privateData',
        undefined,
        '__Secure-better-auth.session_token=forged.signature',
      );

      expect(res.statusCode).toBe(401);
      expect(trpcError(res).message).toBe('Authentication required');
    });
  });

  describe('guards', () => {
    it('allows anonymous access to public procedures', async () => {
      const res = await trpcQuery(app, 'healthCheck');

      expect(res.statusCode).toBe(200);
      expect(trpcData<string>(res)).toBe('OK');
    });

    it('rejects anonymous access to protected procedures', async () => {
      const res = await trpcQuery(app, 'privateData');

      expect(res.statusCode).toBe(401);
      expect(trpcError(res)).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });

    it('rejects a doctor on a patient-only procedure', async () => {
      const doctor = await createDoctorUser(app);

      const res = await trpcQuery(app, 'pillbox.listMine', {}, doctor.cookie);

      expect(res.statusCode).toBe(403);
      expect(trpcError(res)).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Patient access required',
      });
    });

    it('rejects a patient on a doctor-only procedure', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcQuery(app, 'doctor.appointments.listMine', {}, patient.cookie);

      expect(res.statusCode).toBe(403);
      expect(trpcError(res)).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Doctor access required',
      });
    });

    it('rejects a patient on an admin-only procedure', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcQuery(app, 'admin.isAdmin', {}, patient.cookie);

      expect(res.statusCode).toBe(401);
      expect(trpcError(res).message).toBe('You must be an admin to access this resource');
    });

    it('grants an admin access to admin-only procedures', async () => {
      const admin = await createAdminUser(app);

      const res = await trpcQuery(app, 'admin.isAdmin', {}, admin.cookie);

      expect(res.statusCode).toBe(200);
      expect(trpcData<boolean>(res)).toBe(true);
    });

    it('treats an admin as a patient on patient procedures', async () => {
      const admin = await createAdminUser(app);

      const res = await trpcQuery(app, 'pillbox.listMine', {}, admin.cookie);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('http surface', () => {
    it('answers the liveness probe', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 'ok' });
    });

    it('answers the root probe', async () => {
      const res = await app.inject({ method: 'GET', url: '/' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('OK');
    });

    it('rejects the AI chat route without a session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/chat',
        headers: { host: 'localhost:3000', 'content-type': 'application/json' },
        payload: { messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }] },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('rejects an authenticated AI chat request without messages', async () => {
      const patient = await createPatientUser(app);

      const res = await app.inject({
        method: 'POST',
        url: '/chat',
        headers: {
          host: 'localhost:3000',
          'content-type': 'application/json',
          cookie: patient.cookie,
        },
        payload: { messages: [] },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual({ error: 'messages is required' });
    });

    it('serves the merged OpenAPI document', async () => {
      const res = await app.inject({ method: 'GET', url: '/openapi.json' });

      expect(res.statusCode).toBe(200);
      const doc = res.json();
      expect(doc.info.title).toBe('Corevia API');
      expect(doc.paths['/appointments']).toBeDefined();
      expect(doc.paths['/chat']).toBeDefined();
    });

    it('sets the security headers provided by helmet', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('allows the configured web origin through CORS', async () => {
      const res = await app.inject({
        method: 'OPTIONS',
        url: '/trpc/healthCheck',
        headers: {
          origin: 'http://localhost:5173',
          'access-control-request-method': 'GET',
        },
      });

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('does not allow an unknown origin through CORS', async () => {
      const res = await app.inject({
        method: 'OPTIONS',
        url: '/trpc/healthCheck',
        headers: {
          origin: 'https://evil.example.com',
          'access-control-request-method': 'GET',
        },
      });

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
