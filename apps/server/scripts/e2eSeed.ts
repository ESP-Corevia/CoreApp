import { eq, inArray } from 'drizzle-orm';

import { db, pool } from '../src/db';
import {
  appointments,
  doctors,
  patientMedicationIntakes,
  patientMedicationSchedules,
  patientMedications,
  patients,
  users,
} from '../src/db/schema';
import { auth } from '../src/lib/auth';
import { logger } from '../src/lib/logger';

/**
 * Deterministic dataset for the end-to-end suites (`apps/web` back-office and `apps/corevia-app`
 * patient/doctor app).
 *
 * Unlike `authSeed.ts` (large randomised demo dataset), this script creates exactly the accounts and
 * rows the Playwright specs assert on, and it is idempotent: running it twice leaves the same
 * database, which is what makes retries and repeated local runs safe.
 */
export const E2E_PASSWORD = 'E2ePassword!';

export const E2E_USERS = {
  admin: { email: 'e2e-admin@corevia.test', name: 'E2E Admin', role: 'admin' as const },
  doctor: { email: 'e2e-doctor@corevia.test', name: 'E2E Doctor', role: 'doctor' as const },
  patient: { email: 'e2e-patient@corevia.test', name: 'E2E Patient', role: 'patient' as const },
  /** Patient without a profile: exercises the onboarding screen. */
  newPatient: {
    email: 'e2e-new-patient@corevia.test',
    name: 'E2E New Patient',
    role: 'patient' as const,
  },
  /** Doctor whose profile is not verified yet: exercises the pending-verification guard. */
  unverifiedDoctor: {
    email: 'e2e-unverified-doctor@corevia.test',
    name: 'E2E Unverified Doctor',
    role: 'doctor' as const,
  },
};

/** `YYYY-MM-DD` in the Europe/Paris timezone, the timezone the booking rules use. */
function parisDate(daysAhead = 0): string {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
    timeZone: 'Europe/Paris',
  });
}

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

/** Rebuilds the pillbox of a patient: one active medication taken every morning. */
async function resetPillbox(patientId: string): Promise<void> {
  const existing = await db
    .select({ id: patientMedications.id })
    .from(patientMedications)
    .where(eq(patientMedications.patientId, patientId));
  const medicationIds = existing.map(row => row.id);

  if (medicationIds.length > 0) {
    await db
      .delete(patientMedicationIntakes)
      .where(inArray(patientMedicationIntakes.patientMedicationId, medicationIds));
    await db
      .delete(patientMedicationSchedules)
      .where(inArray(patientMedicationSchedules.patientMedicationId, medicationIds));
    await db.delete(patientMedications).where(inArray(patientMedications.id, medicationIds));
  }

  const [medication] = await db
    .insert(patientMedications)
    .values({
      patientId,
      medicationName: 'Doliprane 1000 mg',
      medicationForm: 'comprimé',
      dosageLabel: '1000 mg',
      instructions: 'Take with a glass of water',
      startDate: parisDate(-1),
      isActive: true,
    })
    .returning({ id: patientMedications.id });

  await db.insert(patientMedicationSchedules).values({
    patientMedicationId: medication.id,
    // `weekday: null` means every day, so an intake is always generated for today.
    weekday: null,
    intakeTime: '08:00',
    intakeMoment: 'MORNING',
    quantity: '1',
    unit: 'comprimé',
  });
}

async function main() {
  const adminId = await upsertUser(E2E_USERS.admin);
  const doctorId = await upsertUser(E2E_USERS.doctor);
  const patientId = await upsertUser(E2E_USERS.patient);
  const newPatientId = await upsertUser(E2E_USERS.newPatient);
  const unverifiedDoctorId = await upsertUser(E2E_USERS.unverifiedDoctor);

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
    .insert(doctors)
    .values({
      userId: unverifiedDoctorId,
      specialty: 'Dermatology',
      address: '5 rue Attente, Lyon',
      city: 'Lyon',
      verified: false,
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

  // The onboarding spec needs this account to have no patient profile at all.
  await db.delete(patients).where(eq(patients.userId, newPatientId));

  await resetPillbox(patientId);

  // Appointments are recreated from scratch so status assertions are reproducible.
  await db.delete(appointments).where(eq(appointments.patientId, patientId));

  await db.insert(appointments).values([
    {
      doctorId,
      patientId,
      date: parisDate(3),
      time: '09:00',
      status: 'PENDING',
      reason: 'E2E seeded appointment',
    },
    {
      // Today's appointment: the doctor home screen only lists the current day.
      doctorId,
      patientId,
      date: parisDate(),
      time: '17:30',
      status: 'PENDING',
      reason: 'E2E seeded appointment of the day',
    },
  ]);

  logger.info(
    {
      adminId,
      doctorId,
      patientId,
      newPatientId,
      unverifiedDoctorId,
      appointmentDates: [parisDate(3), parisDate()],
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
