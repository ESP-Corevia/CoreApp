import { faker } from '@faker-js/faker';
import { seed } from 'drizzle-seed';

import * as schema from '../src/db';
const { db, schema: schemas } = schema;
const AVATARS = Array.from({ length: 10 * 2 }, () => faker.image.avatar());
async function main() {
  await seed(db, { users: schemas.users }).refine((funcs) => ({
    users: {
      count: 100,
      columns: {
        firstName: funcs.firstName(),
        lastName: funcs.lastName(),
        email: funcs.email(),
        image: funcs.valuesFromArray({ values: AVATARS }),
        role: funcs.valuesFromArray({ values: ['user', 'admin'] }),
        banned: funcs.boolean(),
        banReason: funcs.loremIpsum(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
        seeded: funcs.valuesFromArray({ values: [true] }),
        lastLoginMethod: funcs.valuesFromArray({ values: ['google', 'github', 'email'] }),
        banExpires: funcs.date(),
        emailVerified: funcs.boolean(),
      },
      // with: {
      //   accounts: 1,
      //   sessions: 1,
      // },
    },
    // accounts: {
    //   columns: {
    //     accountId: funcs.uuid(),
    //     providerId: funcs.valuesFromArray({ values: [faker.company.name()] }),
    //     accessToken: funcs.string(),
    //     refreshToken: funcs.string(),
    //     idToken: funcs.string(),
    //     scope: funcs.string(),
    //     createdAt: funcs.date(),
    //     updatedAt: funcs.date(),
    //   },
    // },
    // sessions: {
    //   columns: {
    //     expiresAt: funcs.date(),
    //     token: funcs.uuid(),
    //     createdAt: funcs.date(),
    //     updatedAt: funcs.date(),
    //     ipAddress: funcs.valuesFromArray({ values: [faker.internet.ip()] }),
    //     userAgent: funcs.valuesFromArray({ values: [faker.internet.userAgent()] }),
    //     impersonatedBy: funcs.fullName(),
    //   },
    // },
    // verifications: {
    //   columns: {
    //     identifier: funcs.email(),
    //     value: funcs.string(),
    //     expiresAt: funcs.date(),
    //     createdAt: funcs.date(),
    //     updatedAt: funcs.date(),
    //   },
    // },
  }));
}
await main();
