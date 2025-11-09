import { faker } from '@faker-js/faker';
import { seed } from 'drizzle-seed';

import * as schema from '../src/db';
const { db, schema: schemas } = schema;
async function main() {
  await seed(db, schemas).refine((funcs) => ({
    users: {
      count: 10,
      columns: {
        firstName: funcs.firstName(),
        lastName: funcs.lastName(),
        email: funcs.email(),
        image: funcs.valuesFromArray({ values: [faker.image.avatar()] }),
        role: funcs.valuesFromArray({ values: [faker.helpers.arrayElement(['user', 'admin'])] }),
        banned: funcs.boolean(),
        banReason: funcs.loremIpsum(),
        createdAt: funcs.date(),
        updatedAt: funcs.date(),
        seeded: funcs.valuesFromArray({ values: [true] }),
      },
      //   with: {
      //     accounts: 2,
      //     sessions: 2,
      //   },
    },
    // accounts: {
    //   columns: {
    //     accountId: funcs.uuid(),
    //     providerId: funcs.companyName(),
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
