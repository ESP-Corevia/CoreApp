import { randomUUID } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { users as usersTable } from '../schema/auth';

import { createUsersRepo } from './users.repository';

// Type assertion to handle the PGlite vs PostgresJs type mismatch in tests
const usersRepo = createUsersRepo(db as any);

let user1: typeof usersTable.$inferSelect;
// eslint-disable-next-line ts/no-unused-vars
let user2: typeof usersTable.$inferSelect;

beforeEach(async () => {
  await applyMigration();

  [user1] = await db
    .insert(usersTable)
    .values({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      emailVerified: true,
    })
    .returning();

  [user2] = await db
    .insert(usersTable)
    .values({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      emailVerified: false,
      image: 'https://example.com/jane.jpg',
    })
    .returning();
});

afterEach(resetDb);

describe('findById', () => {
  it('returns the correct user by id', async () => {
    const found = await usersRepo.findById({ id: user1.id });

    expect(found).toMatchObject({
      id: user1.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      emailVerified: true,
    });
    expect(found?.name).toBe('John Doe');
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it('returns undefined for an unknown id', async () => {
    const found = await usersRepo.findById({ id: randomUUID() });
    expect(found).toBeUndefined();
  });
});

describe('findByEmail', () => {
  it('returns the correct user by email', async () => {
    const found = await usersRepo.findByEmail('john.doe@example.com');

    expect(found).toMatchObject({
      id: user1.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    });
  });

  it('returns undefined for an unknown email', async () => {
    const found = await usersRepo.findByEmail('unknown@example.com');
    expect(found).toBeUndefined();
  });

  it('is case sensitive for email search', async () => {
    const found = await usersRepo.findByEmail('JOHN.DOE@EXAMPLE.COM');
    expect(found).toBeUndefined();
  });
});

describe('repository creation', () => {
  it('can be created with custom db instance', () => {
    const customRepo = createUsersRepo(db as any);
    expect(customRepo).toBeDefined();
    expect(typeof customRepo.findById).toBe('function');
    expect(typeof customRepo.findByEmail).toBe('function');
  });
});
