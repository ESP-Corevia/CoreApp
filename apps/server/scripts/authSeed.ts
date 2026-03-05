import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { db } from '../src/db';
import { users, doctors } from '../src/db/schema';
import { env } from '../src/env';
import { auth } from '../src/lib/auth';
import logger from '../src/lib/logger';

const PATIENT_COUNT = 80;
const DOCTOR_COUNT = 50;

const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Ophthalmology',
  'Gastroenterology',
  'Psychiatry',
  'Radiology',
  'General Practice',
];

const CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Toulouse',
  'Nice',
  'Nantes',
  'Strasbourg',
  'Montpellier',
  'Bordeaux',
  'Lille',
];

function generateUser(role: 'patient' | 'doctor', email: string) {
  return {
    name: faker.person.fullName(),
    email,
    image: faker.image.avatar(),
    role,
    banned: false,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    seeded: true,
    lastLoginMethod: faker.helpers.arrayElement(['google', 'github', 'email'] as const),
    emailVerified: true,
  };
}

async function seedAdmin() {
  const email = env.SEED_ADMIN_EMAIL;
  const password = env.SEED_ADMIN_PASSWORD;

  const existing = await auth.api.signInEmail({ body: { email, password } }).catch(() => null);

  if (existing) {
    logger.info('✔ Admin account already exists, skipping');
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name: 'Admin' },
  });

  const [adminUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (adminUser) {
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, email));
    logger.info(`✔ Admin account created (${email})`);
  }
}

async function main() {
  logger.info('🌱 Seeding database...\n');

  await seedAdmin();

  const patientRows = Array.from({ length: PATIENT_COUNT }, (_, i) =>
    generateUser('patient', `seed.patient.${i}.${faker.string.uuid()}@example.com`),
  );

  const insertedPatients = await db
    .insert(users)
    .values(patientRows)
    .onConflictDoNothing()
    .returning({ id: users.id });

  logger.info(`✔ Inserted ${insertedPatients.length} patients`);

  const doctorUserRows = Array.from({ length: DOCTOR_COUNT }, (_, i) =>
    generateUser('doctor', `seed.doctor.${i}.${faker.string.uuid()}@example.com`),
  );

  const insertedDoctorUsers = await db
    .insert(users)
    .values(doctorUserRows)
    .onConflictDoNothing()
    .returning({ id: users.id });

  if (insertedDoctorUsers.length !== DOCTOR_COUNT) {
    throw new Error(
      `Expected ${DOCTOR_COUNT} doctor users, but inserted ${insertedDoctorUsers.length}. ` +
        `Check unique constraints / conflicts.`,
    );
  }

  logger.info(`✔ Inserted ${insertedDoctorUsers.length} doctor users`);

  const doctorRows = insertedDoctorUsers.map(({ id: userId }) => {
    const city = faker.helpers.arrayElement(CITIES);
    return {
      userId,
      name: `Dr. ${faker.person.fullName()}`,
      specialty: faker.helpers.arrayElement(SPECIALTIES),
      address: `${faker.location.streetAddress()}, ${city}`,
      city,
      imageUrl: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.7 }) ?? null,
      createdAt: faker.date.past(),
    };
  });

  const insertedDoctors = await db
    .insert(doctors)
    .values(doctorRows)
    .onConflictDoNothing()
    .returning({ id: doctors.id });

  if (insertedDoctors.length !== DOCTOR_COUNT) {
    throw new Error(
      `Expected ${DOCTOR_COUNT} doctors, but inserted ${insertedDoctors.length}. ` +
        `Check doctors.userId unique/FK constraints or conflicts.`,
    );
  }

  logger.info(`✔ Inserted ${insertedDoctors.length} doctors (all linked to doctor users)`);

  logger.info('\n🌳 Seeding completed.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('❌ Seed error:', err);
    process.exit(1);
  });
