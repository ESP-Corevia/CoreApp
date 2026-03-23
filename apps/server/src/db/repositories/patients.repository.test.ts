/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
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
});
