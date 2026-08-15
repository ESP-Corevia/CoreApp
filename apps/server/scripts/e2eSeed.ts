import { eq } from 'drizzle-orm';

import { db, pool } from '../src/db';
import { appointments, doctors, patients, users } from '../src/db/schema';
import { auth } from '../src/lib/auth';
import { logger } from '../src/lib/logger';

/**
 * Deterministic dataset for the end-to-end suite.
 *
 * Unlike `authSeed.ts` (large randomised demo dataset), this script creates exactly the accounts
 * and rows the Playwright specs assert on, and it is idempotent: running it twice leaves the same
 * database. Credentials are fixed so the specs never have to discover them.
 */
export const E2E_PASSWORD = 'E2ePassword!';

export const E2E_USERS = {
  admin: { email: 'e2e-admin@corevia.test', name: 'E2E Admin', role: 'admin' as const },
  doctor: { email: 'e2e-doctor@corevia.test', name: 'E2E Doctor', role: 'doctor' as const },
  patient: { email: 'e2e-patient@corevia.test', name: 'E2E Patient', role: 'patient' as const },
};

async function upsertUser({
  email,
  name,
  role,
}: {
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
}): Promise<string> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

  if (!existing) {
    await auth.api.signUpEmail({ body: { email, password: E2E_PASSWORD, name } });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

  if (!user) {
    throw new Error(`failed to create the e2e user ${email}`);
  }

  await db
    .update(users)
    .set({ role, emailVerified: true, seeded: true })
    .where(eq(users.id, user.id));

  return user.id;
}

async function main() {
  const adminId = await upsertUser(E2E_USERS.admin);
  const doctorId = await upsertUser(E2E_USERS.doctor);
  const patientId = await upsertUser(E2E_USERS.patient);

  await db
    .insert(doctors)
    .values({
      userId: doctorId,
      specialty: 'Cardiology',
      address: '12 rue des Tests, Paris',
      city: 'Paris',
      verified: true,
    })
    .onConflictDoNothing();

  await db
    .insert(patients)
    .values({
      userId: patientId,
      dateOfBirth: '1990-01-01',
      gender: 'FEMALE',
      bloodType: 'O+',
      phone: '+33100000000',
    })
    .onConflictDoNothing();

  // Appointments are recreated from scratch so status assertions are reproducible.
  await db.delete(appointments).where(eq(appointments.patientId, patientId));

  const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
    .slice(0, 10);

  await db.insert(appointments).values({
    doctorId,
    patientId,
    date: inThreeDays,
    time: '09:00',
    status: 'PENDING',
    reason: 'E2E seeded appointment',
  });

  logger.info(
    {
      adminId,
      doctorId,
      patientId,
      appointmentDate: inThreeDays,
    },
    '✔ e2e dataset ready',
  );
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async err => {
    logger.error({ err }, '✖ e2e seed failed');
    await pool.end();
    process.exit(1);
  });
