import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { doctors, users } from '../schema';

import { createDoctorsRepo } from './doctors.repository';

const repo = createDoctorsRepo(db as any);

const SEED_DOCTORS = [
  {
    specialty: 'Cardiology',
    address: '10 Rue de Rivoli, Paris',
    city: 'Paris',
    imageUrl: null,
  },
  {
    specialty: 'Dermatology',
    address: '5 Avenue Foch, Lyon',
    city: 'Lyon',
    imageUrl: 'https://example.com/bob.jpg',
  },
  {
    specialty: 'Cardiology',
    address: '22 Rue Victor Hugo, Marseille',
    city: 'Marseille',
    imageUrl: null,
  },
  {
    specialty: 'Pediatrics',
    address: '8 Rue de la Paix, Paris',
    city: 'Paris',
    imageUrl: null,
  },
  {
    specialty: 'Dermatology',
    address: '15 Boulevard Haussmann, Paris',
    city: 'Paris',
    imageUrl: 'https://example.com/eva.jpg',
  },
];

beforeAll(async () => {
  await applyMigration();
});

beforeEach(async () => {
  await resetDb();
  await db.insert(doctors).values(SEED_DOCTORS);
});

describe('doctors.repository', () => {
  describe('listBookable', () => {
    it('returns all doctors ordered by specialty', async () => {
      const items = await repo.listBookable({ offset: 0, limit: 10 });
      expect(items).toHaveLength(5);
      expect(items[0].specialty).toBe('Cardiology');
    });

    it('filters by specialty (exact match)', async () => {
      const items = await repo.listBookable({ specialty: 'Cardiology', offset: 0, limit: 10 });
      expect(items).toHaveLength(2);
      expect(items.every((d) => d.specialty === 'Cardiology')).toBe(true);
    });

    it('filters by city (case-insensitive)', async () => {
      const items = await repo.listBookable({ city: 'paris', offset: 0, limit: 10 });
      expect(items).toHaveLength(3);
      expect(items.every((d) => d.city.toLowerCase() === 'paris')).toBe(true);
    });

    it('filters by search across specialty and address', async () => {
      const items = await repo.listBookable({ search: 'derma', offset: 0, limit: 10 });
      expect(items).toHaveLength(2);
      expect(items.every((d) => d.specialty === 'Dermatology')).toBe(true);
    });

    it('search matches on address', async () => {
      const items = await repo.listBookable({ search: 'Haussmann', offset: 0, limit: 10 });
      expect(items).toHaveLength(1);
      expect(items[0].address).toBe('15 Boulevard Haussmann, Paris');
    });

    it('combines filters (specialty + city)', async () => {
      const items = await repo.listBookable({
        specialty: 'Cardiology',
        city: 'Paris',
        offset: 0,
        limit: 10,
      });
      expect(items).toHaveLength(1);
      expect(items[0].specialty).toBe('Cardiology');
      expect(items[0].city).toBe('Paris');
    });

    it('paginates correctly', async () => {
      const page1 = await repo.listBookable({ offset: 0, limit: 2 });
      const page2 = await repo.listBookable({ offset: 2, limit: 2 });
      const page3 = await repo.listBookable({ offset: 4, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page3).toHaveLength(1);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('returns empty array when no match', async () => {
      const items = await repo.listBookable({ specialty: 'Oncology', offset: 0, limit: 10 });
      expect(items).toEqual([]);
    });
  });

  describe('countBookable', () => {
    it('counts all doctors without filters', async () => {
      const count = await repo.countBookable({});
      expect(count).toBe(5);
    });

    it('counts filtered doctors', async () => {
      const count = await repo.countBookable({ specialty: 'Cardiology' });
      expect(count).toBe(2);
    });

    it('counts with combined filters', async () => {
      const count = await repo.countBookable({ specialty: 'Dermatology', city: 'Paris' });
      expect(count).toBe(1);
    });

    it('returns 0 when no match', async () => {
      const count = await repo.countBookable({ specialty: 'Oncology' });
      expect(count).toBe(0);
    });
  });

  describe('getByUserId', () => {
    let userId: string;

    beforeEach(async () => {
      const [user] = await db
        .insert(users)
        .values({
          name: 'Dr. Wilson',
          email: 'wilson@example.com',
          emailVerified: true,
          createdAt: new Date(),
        })
        .returning({ id: users.id });

      userId = user.id;

      await db.insert(doctors).values({
        userId,
        specialty: 'Neurology',
        address: '2 Rue du Test, Paris',
        city: 'Paris',
      });
    });

    it('returns the doctor with user name when found', async () => {
      const result = await repo.getByUserId(userId);

      expect(result).not.toBeNull();
      expect(result!.specialty).toBe('Neurology');
      expect(result!.city).toBe('Paris');
    });

    it('returns null when userId does not match any doctor', async () => {
      const result = await repo.getByUserId('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });

  describe('updateByUserId', () => {
    let userId: string;

    beforeEach(async () => {
      const [user] = await db
        .insert(users)
        .values({
          name: 'Dr. House',
          email: 'house@example.com',
          emailVerified: true,
          createdAt: new Date(),
        })
        .returning({ id: users.id });

      userId = user.id;

      await db.insert(doctors).values({
        userId,
        specialty: 'Neurology',
        address: '1 Rue du Test, Paris',
        city: 'Paris',
      });
    });

    it('updates the doctor fields and returns the updated row', async () => {
      const result = await repo.updateByUserId(userId, {
        specialty: 'Oncology',
        city: 'Lyon',
      });

      expect(result).not.toBeNull();
      expect(result!.specialty).toBe('Oncology');
      expect(result!.city).toBe('Lyon');
      expect(result!.address).toBe('1 Rue du Test, Paris');
    });

    it('updates the user updatedAt timestamp', async () => {
      const oldDate = new Date('2000-01-01');
      await db.update(users).set({ updatedAt: oldDate }).where(eq(users.id, userId));

      await repo.updateByUserId(userId, { specialty: 'Oncology' });

      const [row] = await db
        .select({ updatedAt: users.updatedAt })
        .from(users)
        .where(eq(users.id, userId));

      expect(row.updatedAt?.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('returns null when userId does not match any doctor', async () => {
      const result = await repo.updateByUserId('00000000-0000-0000-0000-000000000000', {
        specialty: 'Oncology',
      });

      expect(result).toBeNull();
    });
  });

  describe('listAllAdmin', () => {
    let linkedUserId: string;

    beforeEach(async () => {
      // Link one doctor to a user so we get name/email in results
      const [user] = await db
        .insert(users)
        .values({
          name: 'Dr. Alice',
          email: 'alice@example.com',
          emailVerified: true,
          createdAt: new Date(),
        })
        .returning({ id: users.id });
      linkedUserId = user.id;

      // Update the first seeded doctor to link to this user
      const [firstDoc] = await db.select({ id: doctors.id }).from(doctors).limit(1);
      await db.update(doctors).set({ userId: linkedUserId }).where(eq(doctors.id, firstDoc.id));
    });

    it('returns all doctors with user info', async () => {
      const items = await repo.listAllAdmin({ offset: 0, limit: 10 });

      expect(items).toHaveLength(5);
      const linked = items.find((d) => d.userId === linkedUserId);
      expect(linked).toBeDefined();
      expect(linked!.name).toBe('Dr. Alice');
      expect(linked!.email).toBe('alice@example.com');
    });

    it('filters by specialty', async () => {
      const items = await repo.listAllAdmin({ specialty: 'Cardiology', offset: 0, limit: 10 });

      expect(items).toHaveLength(2);
      expect(items.every((d) => d.specialty === 'Cardiology')).toBe(true);
    });

    it('filters by city', async () => {
      const items = await repo.listAllAdmin({ city: 'paris', offset: 0, limit: 10 });

      expect(items).toHaveLength(3);
    });

    it('filters by search on user name', async () => {
      const items = await repo.listAllAdmin({ search: 'Alice', offset: 0, limit: 10 });

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Dr. Alice');
    });

    it('paginates correctly', async () => {
      const page1 = await repo.listAllAdmin({ offset: 0, limit: 2 });
      const page2 = await repo.listAllAdmin({ offset: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });
  });

  describe('countAllAdmin', () => {
    it('counts all doctors', async () => {
      const count = await repo.countAllAdmin({});
      expect(count).toBe(5);
    });

    it('counts with specialty filter', async () => {
      const count = await repo.countAllAdmin({ specialty: 'Cardiology' });
      expect(count).toBe(2);
    });

    it('counts with city filter', async () => {
      const count = await repo.countAllAdmin({ city: 'paris' });
      expect(count).toBe(3);
    });

    it('returns 0 when no match', async () => {
      const count = await repo.countAllAdmin({ specialty: 'Oncology' });
      expect(count).toBe(0);
    });
  });
});
