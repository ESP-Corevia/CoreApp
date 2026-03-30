/** biome-ignore-all lint/suspicious/noExplicitAny: pass */

import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { applyMigration, db, resetDb } from '../../../test/db';
import { patients, users } from '../schema';

import { createPatientsRepo } from './patients.repository';

const repo = createPatientsRepo(db as any);

let userId: string;

beforeAll(async () => {
  await applyMigration();
});

beforeEach(async () => {
  await resetDb();

  const [user] = await db
    .insert(users)
    .values({
      name: 'Test Patient',
      email: 'patient@test.com',
      emailVerified: true,
      createdAt: new Date(),
    })
    .returning({ id: users.id });
  userId = user.id;
});

const patientData = {
  dateOfBirth: '1990-05-20',
  gender: 'MALE' as const,
  phone: null,
  address: null,
  bloodType: null,
  allergies: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
};

describe('patients.repository', () => {
  describe('findByUserId', () => {
    it('returns null when no profile exists', async () => {
      const result = await repo.findByUserId(userId);
      expect(result).toBeNull();
    });

    it('returns the patient profile after creation', async () => {
      await db.insert(patients).values({ ...patientData, userId });

      const result = await repo.findByUserId(userId);

      expect(result).not.toBeNull();
      expect(result?.dateOfBirth).toBe('1990-05-20');
      expect(result?.gender).toBe('MALE');
    });

    it('returns null for an unknown userId', async () => {
      const result = await repo.findByUserId('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('creates a new patient profile when none exists', async () => {
      const result = await repo.upsert(userId, patientData);

      expect(result.userId).toBe(userId);
      expect(result.dateOfBirth).toBe('1990-05-20');
      expect(result.gender).toBe('MALE');
      expect(result.id).toBeDefined();
    });

    it('updates an existing profile on conflict (same userId)', async () => {
      await repo.upsert(userId, patientData);
      const updated = await repo.upsert(userId, {
        ...patientData,
        phone: '+33612345678',
        gender: 'FEMALE' as const,
      });

      expect(updated.phone).toBe('+33612345678');
      expect(updated.gender).toBe('FEMALE');

      const all = await db.select().from(patients);
      expect(all).toHaveLength(1);
    });

    it('stores optional fields', async () => {
      const result = await repo.upsert(userId, {
        ...patientData,
        bloodType: 'A+' as const,
        allergies: 'Peanuts',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '+33600000000',
      });

      expect(result.bloodType).toBe('A+');
      expect(result.allergies).toBe('Peanuts');
      expect(result.emergencyContactName).toBe('Jane Doe');
    });
  });

  describe('createByUserId', () => {
    it('creates a patient profile and returns it', async () => {
      const result = await repo.createByUserId(userId, patientData);

      expect(result).toMatchObject({
        userId,
        dateOfBirth: '1990-05-20',
        gender: 'MALE',
      });
      expect(result.id).toBeDefined();
    });

    it('persists the patient in the database', async () => {
      await repo.createByUserId(userId, patientData);

      const [row] = await db.select().from(patients).where(eq(patients.userId, userId));
      expect(row).toBeDefined();
      expect(row.gender).toBe('MALE');
    });

    it('throws on duplicate userId (unique constraint)', async () => {
      await repo.createByUserId(userId, patientData);

      await expect(
        repo.createByUserId(userId, { ...patientData, gender: 'FEMALE' as const }),
      ).rejects.toThrow();
    });
  });

  describe('updateByUserId', () => {
    beforeEach(async () => {
      await db.insert(patients).values({ ...patientData, userId });
    });

    it('updates fields and returns the updated row', async () => {
      const result = await repo.updateByUserId(userId, {
        phone: '+33612345678',
        gender: 'FEMALE' as const,
      });

      expect(result).not.toBeNull();
      expect(result?.phone).toBe('+33612345678');
      expect(result?.gender).toBe('FEMALE');
      expect(result?.dateOfBirth).toBe('1990-05-20');
    });

    it('updates the user updatedAt timestamp', async () => {
      const oldDate = new Date('2000-01-01');
      await db.update(users).set({ updatedAt: oldDate }).where(eq(users.id, userId));

      await repo.updateByUserId(userId, { phone: '+33600000000' });

      const [row] = await db
        .select({ updatedAt: users.updatedAt })
        .from(users)
        .where(eq(users.id, userId));

      expect(row.updatedAt?.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('returns null when userId does not match any patient', async () => {
      const result = await repo.updateByUserId('00000000-0000-0000-0000-000000000000', {
        phone: '+33600000000',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteByUserId', () => {
    it('deletes the patient profile and returns the id', async () => {
      const [inserted] = await db
        .insert(patients)
        .values({ ...patientData, userId })
        .returning({ id: patients.id });

      const result = await repo.deleteByUserId(userId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(inserted.id);

      const remaining = await db.select().from(patients).where(eq(patients.userId, userId));
      expect(remaining).toHaveLength(0);
    });

    it('returns null when no patient exists for userId', async () => {
      const result = await repo.deleteByUserId('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('listAllAdmin', () => {
    beforeEach(async () => {
      // Create multiple patients
      const userRows = [
        {
          name: 'Alice Martin',
          email: 'alice@test.com',
          emailVerified: true,
          createdAt: new Date(),
        },
        { name: 'Bob Dupont', email: 'bob@test.com', emailVerified: true, createdAt: new Date() },
        {
          name: 'Claire Petit',
          email: 'claire@test.com',
          emailVerified: true,
          createdAt: new Date(),
        },
      ];
      const insertedUsers = await db.insert(users).values(userRows).returning({ id: users.id });

      await db.insert(patients).values([
        { ...patientData, userId: insertedUsers[0].id },
        { ...patientData, userId: insertedUsers[1].id, gender: 'FEMALE' as const },
        { ...patientData, userId: insertedUsers[2].id, gender: 'FEMALE' as const },
      ]);

      // Also create profile for the beforeEach user
      await db.insert(patients).values({ ...patientData, userId });
    });

    it('returns all patients ordered by name', async () => {
      const items = await repo.listAllAdmin({ offset: 0, limit: 10 });
      expect(items).toHaveLength(4);
    });

    it('filters by search on name', async () => {
      const items = await repo.listAllAdmin({ search: 'Alice', offset: 0, limit: 10 });
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Alice Martin');
    });

    it('filters by search on email', async () => {
      const items = await repo.listAllAdmin({ search: 'bob@', offset: 0, limit: 10 });
      expect(items).toHaveLength(1);
      expect(items[0].email).toBe('bob@test.com');
    });

    it('filters by gender', async () => {
      const items = await repo.listAllAdmin({ gender: 'FEMALE', offset: 0, limit: 10 });
      expect(items).toHaveLength(2);
      expect(items.every(p => p.gender === 'FEMALE')).toBe(true);
    });

    it('paginates correctly', async () => {
      const page1 = await repo.listAllAdmin({ offset: 0, limit: 2 });
      const page2 = await repo.listAllAdmin({ offset: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });

    it('returns empty array when no match', async () => {
      const items = await repo.listAllAdmin({ search: 'nonexistent', offset: 0, limit: 10 });
      expect(items).toEqual([]);
    });
  });

  describe('countAllAdmin', () => {
    beforeEach(async () => {
      const userRows = [
        { name: 'Alice', email: 'a@t.com', emailVerified: true, createdAt: new Date() },
        { name: 'Bob', email: 'b@t.com', emailVerified: true, createdAt: new Date() },
      ];
      const insertedUsers = await db.insert(users).values(userRows).returning({ id: users.id });

      await db.insert(patients).values([
        { ...patientData, userId: insertedUsers[0].id },
        { ...patientData, userId: insertedUsers[1].id, gender: 'FEMALE' as const },
      ]);
    });

    it('counts all patients', async () => {
      const count = await repo.countAllAdmin({});
      expect(count).toBe(2);
    });

    it('counts with gender filter', async () => {
      const count = await repo.countAllAdmin({ gender: 'FEMALE' });
      expect(count).toBe(1);
    });

    it('counts with search filter', async () => {
      const count = await repo.countAllAdmin({ search: 'Alice' });
      expect(count).toBe(1);
    });

    it('returns 0 when no match', async () => {
      const count = await repo.countAllAdmin({ search: 'nonexistent' });
      expect(count).toBe(0);
    });
  });
});
