import { faker } from '@faker-js/faker';

import { db } from '../src/db';
import { users, doctors } from '../src/db/schema';
import logger from '../src/lib/logger';

const USER_COUNT = 100;
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

function generateUser() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    image: faker.image.avatar(),
    role: faker.helpers.arrayElement(['user', 'admin']),
    banned: faker.datatype.boolean(),
    banReason: faker.lorem.sentence(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    seeded: true,
    lastLoginMethod: faker.helpers.arrayElement(['google', 'github', 'email']),
    banExpires: faker.date.future(),
    emailVerified: faker.datatype.boolean(),
  };
}

async function main() {
  logger.info('🌱 Seeding database...\n');

  const userRows = Array.from({ length: USER_COUNT }, generateUser);

  const insertedUsers = await db
    .insert(users)
    .values(userRows)
    .onConflictDoNothing()
    .returning({ id: users.id });
  logger.info(`✔ Inserted ${insertedUsers.length} users`);

  const doctorRows = Array.from({ length: DOCTOR_COUNT }, () => {
    const city = faker.helpers.arrayElement(CITIES);
    return {
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
  logger.info(`✔ Inserted ${insertedDoctors.length} doctors`);

  logger.info('\n🌳 Seeding completed.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('❌ Seed error:', err);
    process.exit(1);
  });
