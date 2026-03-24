import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { db } from '../src/db';
import {
  doctors,
  patientMedicationSchedules,
  patientMedications,
  patients,
  users,
} from '../src/db/schema';
import { env } from '../src/env';
import { auth } from '../src/lib/auth';
import { logger } from '../src/lib/logger';

const PATIENT_COUNT = 80;
const DOCTOR_COUNT = 50;
const PILLBOX_MEDS_PER_PATIENT = 3;

const SEED_MEDICATIONS = [
  {
    name: 'DOLIPRANE 500mg',
    form: 'comprime',
    cis: '60234100',
    substances: ['PARACETAMOL'],
    dosage: '500mg',
  },
  {
    name: 'DOLIPRANE 1000mg',
    form: 'comprime',
    cis: '61234100',
    substances: ['PARACETAMOL'],
    dosage: '1000mg',
  },
  {
    name: 'IBUPROFENE 200mg',
    form: 'comprime',
    cis: '62345200',
    substances: ['IBUPROFENE'],
    dosage: '200mg',
  },
  {
    name: 'AMOXICILLINE 500mg',
    form: 'gelule',
    cis: '63456300',
    substances: ['AMOXICILLINE'],
    dosage: '500mg',
  },
  {
    name: 'METFORMINE 850mg',
    form: 'comprime',
    cis: '64567400',
    substances: ['METFORMINE'],
    dosage: '850mg',
  },
  {
    name: 'LEVOTHYROXINE 75ug',
    form: 'comprime',
    cis: '65678500',
    substances: ['LEVOTHYROXINE'],
    dosage: '75ug',
  },
  {
    name: 'OMEPRAZOLE 20mg',
    form: 'gelule',
    cis: '66789600',
    substances: ['OMEPRAZOLE'],
    dosage: '20mg',
  },
  {
    name: 'SIMVASTATINE 20mg',
    form: 'comprime',
    cis: '67890700',
    substances: ['SIMVASTATINE'],
    dosage: '20mg',
  },
  {
    name: 'AMLODIPINE 5mg',
    form: 'comprime',
    cis: '68901800',
    substances: ['AMLODIPINE'],
    dosage: '5mg',
  },
  {
    name: 'VENTOLINE 100ug',
    form: 'inhalation',
    cis: '69012900',
    substances: ['SALBUTAMOL'],
    dosage: '100ug',
  },
  {
    name: 'SERTRALINE 50mg',
    form: 'comprime',
    cis: '70123100',
    substances: ['SERTRALINE'],
    dosage: '50mg',
  },
  {
    name: 'BISOPROLOL 5mg',
    form: 'comprime',
    cis: '71234200',
    substances: ['BISOPROLOL'],
    dosage: '5mg',
  },
];

const SEED_MOMENTS = ['MORNING', 'NOON', 'EVENING', 'BEDTIME'] as const;
const MOMENT_TIMES: Record<string, string> = {
  MORNING: '08:00',
  NOON: '12:00',
  EVENING: '19:00',
  BEDTIME: '22:00',
};

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

async function seedPillbox(patientIds: string[]) {
  let totalMeds = 0;
  let totalSchedules = 0;

  for (const patientId of patientIds) {
    const meds = faker.helpers.arrayElements(SEED_MEDICATIONS, PILLBOX_MEDS_PER_PATIENT);

    for (const med of meds) {
      const startDate = faker.date.past({ years: 1 }).toISOString().split('T')[0];
      const hasEndDate = faker.datatype.boolean();
      const endDate = hasEndDate
        ? faker.date.future({ years: 1 }).toISOString().split('T')[0]
        : null;

      const [inserted] = await db
        .insert(patientMedications)
        .values({
          patientId,
          medicationName: med.name,
          medicationForm: med.form,
          cis: med.cis,
          source: 'api-medicaments-fr',
          activeSubstances: med.substances,
          dosageLabel: med.dosage,
          instructions:
            faker.helpers.maybe(
              () =>
                faker.helpers.arrayElement([
                  'Prendre au cours du repas',
                  'Prendre a jeun',
                  "Avec un grand verre d'eau",
                  'Ne pas croquer',
                  'Espacer les prises de 6h minimum',
                ]),
              { probability: 0.6 },
            ) ?? null,
          startDate,
          endDate,
          isActive: faker.helpers.weightedArrayElement([
            { value: true, weight: 4 },
            { value: false, weight: 1 },
          ]),
        })
        .returning({ id: patientMedications.id });

      totalMeds++;

      const scheduleCount = faker.number.int({ min: 1, max: 3 });
      const moments = faker.helpers.arrayElements(SEED_MOMENTS, scheduleCount);

      const scheduleRows = moments.map(moment => ({
        patientMedicationId: inserted.id,
        intakeTime: MOMENT_TIMES[moment],
        intakeMoment: moment as 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME',
        quantity: String(faker.number.int({ min: 1, max: 3 })),
        unit: med.form === 'gelule' ? 'gelule' : 'comprime',
      }));

      await db.insert(patientMedicationSchedules).values(scheduleRows);
      totalSchedules += scheduleRows.length;
    }
  }

  logger.info(
    `Seeded pillbox: ${totalMeds} medications, ${totalSchedules} schedules across ${patientIds.length} patients`,
  );
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

  // Seed pillbox for the dedicated patient account + a few random seeded patients
  const [dedicatedPatient] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'patient@patient.com'))
    .limit(1);

  const pillboxPatientIds = [
    ...(dedicatedPatient ? [dedicatedPatient.id] : []),
    ...insertedPatientsUsers.slice(0, 10).map(p => p.id),
  ];

  await seedPillbox(pillboxPatientIds);

  logger.info('\n🌳 Seeding completed.');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    logger.error('❌ Seed error:', err);
    process.exit(1);
  });
