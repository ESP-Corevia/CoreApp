/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { users as usersTable } from '../schema/auth';
import { doctors } from '../schema/doctors';
import { patients } from '../schema/patients';

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
      name: 'John Doe',
      email: 'john.doe@example.com',
      emailVerified: true,
    })
    .returning();

  [user2] = await db
    .insert(usersTable)
    .values({
      name: 'Jane Smith',
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
      name: 'John Doe',
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
      name: 'John Doe',
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
      { name: 'A', email: 'a@example.com' },
      { name: 'B', email: 'b@example.com' },
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

describe('listUsersWithDetails', () => {
  let doctorUserId: string;
  let patientUserId: string;

  beforeEach(async () => {
    // Create a doctor user + profile
    const [docUser] = await db
      .insert(usersTable)
      .values({
        name: 'Dr. House',
        email: 'house@hospital.com',
        emailVerified: true,
        role: 'doctor',
      })
      .returning();
    doctorUserId = docUser.id;

    await db.insert(doctors).values({
      userId: docUser.id,
      specialty: 'Cardiology',
      address: '10 Rue de la Paix',
      city: 'Paris',
    });

    // Create a patient user + profile
    const [patUser] = await db
      .insert(usersTable)
      .values({
        name: 'Alice Dupont',
        email: 'alice@patient.com',
        emailVerified: true,
        role: 'patient',
      })
      .returning();
    patientUserId = patUser.id;

    await db.insert(patients).values({
      userId: patUser.id,
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE',
    });
  });

  it('returns doctors from the doctor view', async () => {
    const result = await usersRepo.listUsersWithDetails({ role: 'doctor' });

    expect(result.users).toHaveLength(1);
    expect(result.users[0]).toMatchObject({
      userId: doctorUserId,
      name: 'Dr. House',
      specialty: 'Cardiology',
      city: 'Paris',
    });
    expect(result.totalItems).toBe(1);
  });

  it('returns patients from the patient view', async () => {
    const result = await usersRepo.listUsersWithDetails({ role: 'patient' });

    expect(result.users).toHaveLength(1);
    expect(result.users[0]).toMatchObject({
      userId: patientUserId,
      name: 'Alice Dupont',
      dateOfBirth: '1990-01-15',
      gender: 'FEMALE',
    });
    expect(result.totalItems).toBe(1);
  });

  it('filters by search on name (ilike)', async () => {
    const result = await usersRepo.listUsersWithDetails({
      role: 'doctor',
      search: 'house',
    });
    expect(result.users).toHaveLength(1);

    const empty = await usersRepo.listUsersWithDetails({
      role: 'doctor',
      search: 'unknown',
    });
    expect(empty.users).toHaveLength(0);
  });

  it('filters by search on email (ilike)', async () => {
    const result = await usersRepo.listUsersWithDetails({
      role: 'patient',
      search: 'alice@',
    });
    expect(result.users).toHaveLength(1);
    expect(result.users[0].email).toBe('alice@patient.com');
  });

  it('filters by exact user id', async () => {
    const result = await usersRepo.listUsersWithDetails({
      role: 'doctor',
      id: doctorUserId,
    });
    expect(result.users).toHaveLength(1);

    const empty = await usersRepo.listUsersWithDetails({
      role: 'doctor',
      id: randomUUID(),
    });
    expect(empty.users).toHaveLength(0);
  });

  it('combines search and id filters', async () => {
    const result = await usersRepo.listUsersWithDetails({
      role: 'doctor',
      id: doctorUserId,
      search: 'house',
    });
    expect(result.users).toHaveLength(1);

    const mismatch = await usersRepo.listUsersWithDetails({
      role: 'doctor',
      id: doctorUserId,
      search: 'unknown',
    });
    expect(mismatch.users).toHaveLength(0);
  });

  it('paginates correctly', async () => {
    // Add a second doctor
    const [doc2] = await db
      .insert(usersTable)
      .values({
        name: 'Dr. Wilson',
        email: 'wilson@hospital.com',
        emailVerified: true,
        role: 'doctor',
      })
      .returning();
    await db.insert(doctors).values({
      userId: doc2.id,
      specialty: 'Oncology',
      address: '20 Rue Rivoli',
      city: 'Lyon',
    });

    const page1 = await usersRepo.listUsersWithDetails({
      role: 'doctor',
      page: 1,
      perPage: 1,
    });
    expect(page1.users).toHaveLength(1);
    expect(page1.totalItems).toBe(2);
    expect(page1.totalPages).toBe(2);

    const page2 = await usersRepo.listUsersWithDetails({
      role: 'doctor',
      page: 2,
      perPage: 1,
    });
    expect(page2.users).toHaveLength(1);
    expect(page2.page).toBe(2);
  });

  it('returns empty when no data matches the role view', async () => {
    await resetDb();
    const result = await usersRepo.listUsersWithDetails({ role: 'doctor' });
    expect(result.users).toHaveLength(0);
    expect(result.totalItems).toBe(0);
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
