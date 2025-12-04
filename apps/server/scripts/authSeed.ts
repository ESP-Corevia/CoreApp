import { faker } from '@faker-js/faker';

import { db } from '../src/db';
import { users } from '../src/db/schema';
import logger from '../src/lib/logger';

const USER_COUNT = 100;

function generateUser() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
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

  logger.info('\n🌳 Seeding completed.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('❌ Seed error:', err);
    process.exit(1);
  });
