import type { APIRequestContext } from '@playwright/test';
import { expect, request as playwrightRequest } from '@playwright/test';

import { E2E_PASSWORD, parisDate, SEEDED_MEDICATION } from './fixtures';

// Node resolves `localhost` to ::1 first while the API binds 0.0.0.0 (IPv4 only), so this
// out-of-browser client must target the IPv4 loopback explicitly.
const API_URL = (process.env.E2E_API_URL ?? 'http://localhost:3000').replace(
  'localhost',
  '127.0.0.1',
);
const ADMIN_EMAIL = 'e2e-admin@corevia.test';

/**
 * Admin-authenticated API client used by the specs to rebuild their own fixtures.
 *
 * Every journey below mutates data (booking a slot, taking a medication, confirming an
 * appointment), so replaying a test — or a CI retry — would otherwise hit a state the test did not
 * create. Resetting through the real admin endpoints keeps each test idempotent without reaching
 * into the database.
 */
export async function adminApi(): Promise<APIRequestContext> {
  const api = await playwrightRequest.newContext({ baseURL: API_URL });

  const signIn = await api.post('/api/auth/sign-in/email', {
    data: { email: ADMIN_EMAIL, password: E2E_PASSWORD },
  });
  expect(signIn.ok(), 'admin sign-in must succeed — run db:seed:e2e').toBeTruthy();

  return api;
}

async function query<T>(api: APIRequestContext, path: string, input: unknown): Promise<T> {
  const res = await api.get(`/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input))}`);
  expect(res.ok(), `${path} must answer (${res.status()})`).toBeTruthy();
  return (await res.json()).result.data as T;
}

async function mutate<T>(api: APIRequestContext, path: string, input: unknown): Promise<T> {
  const res = await api.post(`/trpc/${path}`, { data: input });
  expect(res.ok(), `${path} must answer (${res.status()})`).toBeTruthy();
  return (await res.json()).result.data as T;
}

export interface SeededIds {
  doctorId: string;
  patientId: string;
}

/** Resolves the user ids of the seeded doctor and patient. */
export async function seededIds(api: APIRequestContext): Promise<SeededIds> {
  const doctors = await query<{ doctors: Array<{ userId: string | null; name: string | null }> }>(
    api,
    'admin.listDoctors',
    { page: 1, perPage: 50, search: 'E2E Doctor' },
  );
  const patients = await query<{ patients: Array<{ userId: string; name: string }> }>(
    api,
    'admin.listPatients',
    { page: 1, perPage: 50, search: 'E2E Patient' },
  );

  const doctorId = doctors.doctors.find(entry => entry.name === 'E2E Doctor')?.userId;
  const patientId = patients.patients.find(entry => entry.name === 'E2E Patient')?.userId;

  if (!doctorId || !patientId) {
    throw new Error('seeded doctor and patient must exist — run db:seed:e2e');
  }

  return { doctorId, patientId };
}

/** Resolves a user id from the admin directory, whether or not the user has a profile. */
export async function findUserId(api: APIRequestContext, search: string): Promise<string> {
  const { users } = await query<{ users: Array<{ id: string; name: string }> }>(
    api,
    'admin.listUsers',
    { page: 1, perPage: 50, search },
  );

  const user = users.find(entry => entry.name === search);

  if (!user) {
    throw new Error(`user "${search}" must exist — run db:seed:e2e`);
  }

  return user.id;
}

/** Removes the patient profile of a user so the onboarding screen shows up again. */
export async function removePatientProfile(api: APIRequestContext, userId: string): Promise<void> {
  // The user may legitimately have no profile yet, in which case the endpoint answers NOT_FOUND.
  await api.post('/trpc/admin.deletePatient', { data: { userId } });
}

/** Deletes every appointment of the seeded patient on a given date. */
export async function clearAppointmentsOn(api: APIRequestContext, date: string): Promise<void> {
  const { appointments } = await query<{
    appointments: Array<{ id: string; date: string; patientName: string | null }>;
  }>(api, 'admin.listAppointments', {
    page: 1,
    perPage: 50,
    search: 'E2E Patient',
    from: date,
    to: date,
  });

  for (const appointment of appointments) {
    await mutate(api, 'admin.deleteAppointment', { id: appointment.id });
  }
}

/** Recreates the appointment the doctor screens act on, always PENDING and always today. */
export async function resetTodaysAppointment(
  api: APIRequestContext,
  { doctorId, patientId }: SeededIds,
  time = '17:30',
): Promise<void> {
  await clearAppointmentsOn(api, parisDate());
  await mutate(api, 'admin.createAppointment', {
    doctorId,
    patientId,
    date: parisDate(),
    time,
    reason: 'E2E seeded appointment of the day',
  });
}

/** Recreates the pillbox of the seeded patient with one pending intake for today. */
export async function resetPillbox(api: APIRequestContext, patientId: string): Promise<void> {
  const { items } = await query<{ items: Array<{ id: string }> }>(api, 'admin.adminListPillbox', {
    patientId,
    page: 1,
    limit: 50,
  });

  for (const item of items) {
    await mutate(api, 'admin.adminDeleteMedication', { id: item.id });
  }

  await mutate(api, 'admin.adminCreateMedication', {
    patientId,
    medicationName: SEEDED_MEDICATION,
    medicationForm: 'comprimé',
    dosageLabel: '1000 mg',
    startDate: parisDate(-1),
    schedules: [{ intakeTime: '08:00', intakeMoment: 'MORNING', quantity: '1', unit: 'comprimé' }],
  });
}
