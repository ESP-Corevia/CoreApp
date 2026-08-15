import { eq } from 'drizzle-orm';
import type { FastifyInstance, LightMyRequestResponse as InjectResponse } from 'fastify';

import { buildApp } from '../../src/app';
import { doctors, patients, sessions, users } from '../../src/db/schema';
import { services } from '../../src/db/services';
import { auth } from '../../src/lib/auth';
import { applyMigration, db, resetDb } from '../db';

/**
 * Integration harness: boots the real Fastify application (better-auth + tRPC + services +
 * repositories) on top of the in-memory PGlite database and exposes helpers to drive it
 * through HTTP with `app.inject()`.
 *
 * Only genuinely external infrastructure (S3, the French medication API, the LLM provider)
 * is stubbed inside the individual specs; every layer of Corevia itself is real here.
 */

/** Password used by every fixture user; satisfies the 8 character minimum policy. */
export const TEST_PASSWORD = 'Sup3rSecret!';

const JSON_HEADERS = {
  host: 'localhost:3000',
  'content-type': 'application/json',
};

let emailSequence = 0;

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Cookie header carrying an authenticated session for this user. */
  cookie: string;
}

/**
 * Boots the application once for a spec file. Callers are expected to `resetDb()` between
 * tests so each test starts from an empty database.
 */
export async function createIntegrationApp(): Promise<FastifyInstance> {
  await applyMigration();
  await resetDb();

  const app = await buildApp({ auth, services, logger: false });
  await app.ready();

  return app;
}

/** Truncates every table so the next test starts from a clean database. */
export async function resetIntegrationDb(): Promise<void> {
  await resetDb();
}

/** Builds a unique email address for a fixture user. */
export function uniqueEmail(prefix: string): string {
  emailSequence += 1;
  return `${prefix}.${emailSequence}@corevia.test`;
}

/** Collapses `set-cookie` response headers into a single `cookie` request header. */
export function cookiesFrom(res: InjectResponse): string {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  return list.map(cookie => cookie.split(';')[0]).join('; ');
}

export function signUp(
  app: FastifyInstance,
  {
    email,
    password = TEST_PASSWORD,
    name = 'Test User',
  }: { email: string; password?: string; name?: string },
): Promise<InjectResponse> {
  return app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    headers: JSON_HEADERS,
    payload: { name, email, password },
  });
}

export function signIn(
  app: FastifyInstance,
  { email, password = TEST_PASSWORD }: { email: string; password?: string },
): Promise<InjectResponse> {
  return app.inject({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    headers: JSON_HEADERS,
    payload: { email, password },
  });
}

export function signOut(app: FastifyInstance, cookie: string): Promise<InjectResponse> {
  return app.inject({
    method: 'POST',
    url: '/api/auth/sign-out',
    headers: { ...JSON_HEADERS, cookie },
    payload: {},
  });
}

/**
 * Strips better-auth's `session_data` cache cookie, forcing the next request to resolve the
 * session against the database instead of the signed cache payload.
 */
export function withoutSessionCache(cookie: string): string {
  return cookie
    .split('; ')
    .filter(part => !part.includes('session_data'))
    .join('; ');
}

/** Extracts the raw session token carried by a `cookie` header. */
export function sessionTokenFrom(cookie: string): string {
  const part = cookie.split('; ').find(entry => entry.includes('session_token='));

  if (!part) {
    throw new Error(`no session token found in cookie: ${cookie}`);
  }

  const value = decodeURIComponent(part.slice(part.indexOf('=') + 1));
  return value.split('.')[0];
}

/** True when a session row still exists for that token. */
export async function sessionExists(token: string): Promise<boolean> {
  const rows = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.token, token));
  return rows.length > 0;
}

/**
 * Creates a real account through the sign-up endpoint, promotes it to `role` when needed and
 * signs it in so the returned cookie carries the final role.
 */
export async function createUser(
  app: FastifyInstance,
  { role, name, email = uniqueEmail(role) }: { role: UserRole; name?: string; email?: string },
): Promise<TestUser> {
  const displayName = name ?? `${role} fixture`;
  const signUpRes = await signUp(app, { email, name: displayName });

  if (signUpRes.statusCode !== 200) {
    throw new Error(`fixture sign-up failed (${signUpRes.statusCode}): ${signUpRes.body}`);
  }

  const created: unknown = signUpRes.json();
  const id = extractUserId(created);

  if (role !== 'patient') {
    await db.update(users).set({ role }).where(eq(users.id, id));
  }

  const signInRes = await signIn(app, { email });
  if (signInRes.statusCode !== 200) {
    throw new Error(`fixture sign-in failed (${signInRes.statusCode}): ${signInRes.body}`);
  }

  return { id, email, name: displayName, role, cookie: cookiesFrom(signInRes) };
}

/** Creates a patient account together with its `patients` profile row. */
export async function createPatientUser(
  app: FastifyInstance,
  profile: { dateOfBirth?: string; gender?: 'MALE' | 'FEMALE' } = {},
): Promise<TestUser> {
  const user = await createUser(app, { role: 'patient', name: 'Patient Fixture' });

  await db.insert(patients).values({
    userId: user.id,
    dateOfBirth: profile.dateOfBirth ?? '1990-01-01',
    gender: profile.gender ?? 'MALE',
  });

  return user;
}

/** Creates a doctor account together with its `doctors` profile row. */
export async function createDoctorUser(
  app: FastifyInstance,
  profile: { specialty?: string; city?: string; address?: string; verified?: boolean } = {},
): Promise<TestUser> {
  const user = await createUser(app, { role: 'doctor', name: 'Doctor Fixture' });

  await db.insert(doctors).values({
    userId: user.id,
    specialty: profile.specialty ?? 'Cardiology',
    address: profile.address ?? '1 rue de Test',
    city: profile.city ?? 'Paris',
    verified: profile.verified ?? true,
  });

  return user;
}

/** Creates an administrator account. */
export function createAdminUser(app: FastifyInstance): Promise<TestUser> {
  return createUser(app, { role: 'admin', name: 'Admin Fixture' });
}

/** Calls a tRPC query over HTTP, optionally authenticated with `cookie`. */
export function trpcQuery(
  app: FastifyInstance,
  path: string,
  input?: unknown,
  cookie?: string,
): Promise<InjectResponse> {
  const query = input === undefined ? '' : `?input=${encodeURIComponent(JSON.stringify(input))}`;

  return app.inject({
    method: 'GET',
    url: `/trpc/${path}${query}`,
    headers: cookie ? { ...JSON_HEADERS, cookie } : JSON_HEADERS,
  });
}

/** Calls a tRPC mutation over HTTP, optionally authenticated with `cookie`. */
export function trpcMutate(
  app: FastifyInstance,
  path: string,
  input: Record<string, unknown> = {},
  cookie?: string,
): Promise<InjectResponse> {
  return app.inject({
    method: 'POST',
    url: `/trpc/${path}`,
    headers: cookie ? { ...JSON_HEADERS, cookie } : JSON_HEADERS,
    payload: input,
  });
}

/**
 * Unwraps a successful tRPC envelope. Throws with the server error message when the call
 * failed, so a broken journey reports the real cause instead of `undefined`.
 */
export function trpcData<T>(res: InjectResponse): T {
  const body: unknown = res.json();

  if (isTrpcError(body)) {
    throw new Error(`tRPC call failed (${res.statusCode}): ${body.error.message}`);
  }

  if (!isTrpcResult(body)) {
    throw new Error(`unexpected tRPC envelope (${res.statusCode}): ${res.body}`);
  }

  return body.result.data as T;
}

export interface TrpcErrorShape {
  message: string;
  code: string;
  httpStatus: number;
}

/** Extracts the error envelope of a failed tRPC call. */
export function trpcError(res: InjectResponse): TrpcErrorShape {
  const body: unknown = res.json();

  if (!isTrpcError(body)) {
    throw new Error(`expected a tRPC error but got (${res.statusCode}): ${res.body}`);
  }

  return {
    message: body.error.message,
    code: body.error.data?.code ?? 'UNKNOWN',
    httpStatus: body.error.data?.httpStatus ?? res.statusCode,
  };
}

/** Returns a `YYYY-MM-DD` date in the Europe/Paris timezone, `daysAhead` days from now. */
export function parisDate(daysAhead = 0): string {
  const target = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return target.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
}

interface TrpcErrorBody {
  error: { message: string; data?: { code?: string; httpStatus?: number } };
}

function isTrpcError(body: unknown): body is TrpcErrorBody {
  return typeof body === 'object' && body !== null && 'error' in body;
}

function isTrpcResult(body: unknown): body is { result: { data: unknown } } {
  return typeof body === 'object' && body !== null && 'result' in body;
}

function extractUserId(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'user' in payload) {
    const user = payload.user;
    if (user && typeof user === 'object' && 'id' in user && typeof user.id === 'string') {
      return user.id;
    }
  }

  throw new Error(`sign-up response did not contain a user id: ${JSON.stringify(payload)}`);
}
