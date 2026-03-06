import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { db } from '../src/db';
import { users, doctors, patients } from '../src/db/schema';
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
    banned: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    seeded: true,
    lastLoginMethod: faker.helpers.arrayElement(['google', 'github', 'email'] as const),
    emailVerified: faker.datatype.boolean(),
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

async function seedDoctor() {
  const email = 'doctor@doctor.com';
  const password = 'azertyuiop';

  const existing = await auth.api.signInEmail({ body: { email, password } }).catch(() => null);

  if (existing) {
    logger.info('✔ Doctor account already exists, skipping');
    return;
  }

  await auth.api.signUpEmail({ body: { email, password, name: 'Doctor' } });

  const [doctorUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (doctorUser) {
    await db.update(users).set({ role: 'doctor' }).where(eq(users.email, email));

    const city = faker.helpers.arrayElement(CITIES);
    await db
      .insert(doctors)
      .values({
        userId: doctorUser.id,
        specialty: faker.helpers.arrayElement(SPECIALTIES),
        address: `${faker.location.streetAddress()}, ${city}`,
        city,
      })
      .onConflictDoNothing();

    logger.info(`✔ Doctor account created (${email})`);
  }
}

async function seedPatient() {
  const email = 'patient@patient.com';
  const password = 'azertyuiop';

  const existing = await auth.api.signInEmail({ body: { email, password } }).catch(() => null);

  if (existing) {
    logger.info('✔ Patient account already exists, skipping');
    return;
  }

  await auth.api.signUpEmail({ body: { email, password, name: 'Patient' } });

  const [patientUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (patientUser) {
    await db.update(users).set({ role: 'patient' }).where(eq(users.email, email));

    await db
      .insert(patients)
      .values({
        userId: patientUser.id,
        dateOfBirth: faker.date
          .birthdate({ min: 18, max: 90, mode: 'age' })
          .toISOString()
          .split('T')[0],
        gender: faker.helpers.arrayElement(['MALE', 'FEMALE'] as const),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        bloodType: faker.helpers.arrayElement([
          'A+',
          'A-',
          'B+',
          'B-',
          'AB+',
          'AB-',
          'O+',
          'O-',
        ] as const),
        allergies: faker.lorem.words(faker.number.int({ min: 0, max: 5 })),
        emergencyContactName: faker.person.fullName(),
        emergencyContactPhone: faker.phone.number(),
      })
      .onConflictDoNothing();

    logger.info(`✔ Patient account created (${email})`);
  }
}

async function main() {
  logger.info('🌱 Seeding database...\n');

  await seedAdmin();
  await seedDoctor();
  await seedPatient();

  const patientUserRows = Array.from({ length: PATIENT_COUNT }, (_, i) =>
    generateUser('patient', `seed.patient.${i}.${faker.string.uuid()}@example.com`),
  );

  const insertedPatientsUsers = await db
    .insert(users)
    .values(patientUserRows)
    .onConflictDoNothing()
    .returning({ id: users.id });

  logger.info(`✔ Inserted ${insertedPatientsUsers.length} patients`);

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
      specialty: faker.helpers.arrayElement(SPECIALTIES),
      address: `${faker.location.streetAddress()}, ${city}`,
      city,
    };
  });
  const patientRows = insertedPatientsUsers.map(({ id: userId }) => ({
    userId,
    dateOfBirth: faker.date
      .birthdate({ min: 18, max: 90, mode: 'age' })
      .toISOString()
      .split('T')[0],
    gender: faker.helpers.arrayElement(['MALE', 'FEMALE'] as const),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    bloodType: faker.helpers.arrayElement([
      'A+',
      'A-',
      'B+',
      'B-',
      'AB+',
      'AB-',
      'O+',
      'O-',
    ] as const),
    allergies: faker.lorem.words(faker.number.int({ min: 0, max: 5 })),
    emergencyContactName: faker.person.fullName(),
    emergencyContactPhone: faker.phone.number(),
  }));
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
  const insertedPatients = await db
    .insert(patients)
    .values(patientRows)
    .onConflictDoNothing()
    .returning({ id: patients.id });

  if (insertedPatients.length !== PATIENT_COUNT) {
    throw new Error(
      `Expected ${PATIENT_COUNT} patients, but inserted ${insertedPatients.length}. ` +
        `Check patients.userId unique/FK constraints or conflicts.`,
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
