import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { users as usersTable } from '../schema/auth';

import { createUsersRepo } from './users.repository';

// Type assertion to handle the PGlite vs PostgresJs type mismatch in tests
const usersRepo = createUsersRepo(db as any);

let user1: typeof usersTable.$inferSelect;

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
describe('listUsers', () => {
  it('returns all users except the requesting user', async () => {
    const result = await usersRepo.listUsers({
      userId: user1.id,
      options: {},
      pageParams: {},
    });

    expect(result.users.length).toBe(1);
    expect(result.users[0].id).toBe(user2.id);

    expect(result.totalItems).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(10);
  });

  it('applies pagination correctly', async () => {
    await db.insert(usersTable).values([
      { firstName: 'A', lastName: 'A', email: 'a@example.com' },
      { firstName: 'B', lastName: 'B', email: 'b@example.com' },
    ]);

    const result = await usersRepo.listUsers({
      userId: user1.id,
      options: { limit: 1, offset: 0 },
      pageParams: { page: 1, perPage: 1 },
    });

    expect(result.users.length).toBe(1);
    expect(result.totalItems).toBe(3);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });

  it('applies ordering via options.orderBy', async () => {
    const result = await usersRepo.listUsers({
      userId: user1.id,
      options: {
        orderBy: (table, { asc }) => asc(table.email),
      },
      pageParams: {},
    });

    expect(result.users.length).toBe(1);
    expect(result.users[0].email).toBe('jane.smith@example.com');
  });

  it('respects additional where conditions', async () => {
    const result = await usersRepo.listUsers({
      userId: user1.id,
      options: {
        where: eq(usersTable.emailVerified, false),
      },
      pageParams: {},
    });

    expect(result.users.length).toBe(1);
    expect(result.users[0].id).toBe(user2.id);
  });

  it('combines existing where with exclusion of userId', async () => {
    const result = await usersRepo.listUsers({
      userId: user1.id,
      options: {
        where: eq(usersTable.emailVerified, true),
      },
      pageParams: {},
    });

    expect(result.users.length).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('returns empty results when no users match', async () => {
    const result = await usersRepo.listUsers({
      userId: user1.id,
      options: {
        where: eq(usersTable.email, 'does.not.exist@example.com'),
      },
      pageParams: {},
    });

    expect(result.users.length).toBe(0);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
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
