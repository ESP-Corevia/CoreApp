import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { doctors } from '../schema';

import { createDoctorsRepo } from './doctors.repository';

const repo = createDoctorsRepo(db as any);

const SEED_DOCTORS = [
  {
    name: 'Dr. Alice Martin',
    specialty: 'Cardiology',
    address: '10 Rue de Rivoli, Paris',
    city: 'Paris',
    imageUrl: null,
  },
  {
    name: 'Dr. Bob Dupont',
    specialty: 'Dermatology',
    address: '5 Avenue Foch, Lyon',
    city: 'Lyon',
    imageUrl: 'https://example.com/bob.jpg',
  },
  {
    name: 'Dr. Claire Leroy',
    specialty: 'Cardiology',
    address: '22 Rue Victor Hugo, Marseille',
    city: 'Marseille',
    imageUrl: null,
  },
  {
    name: 'Dr. David Morel',
    specialty: 'Pediatrics',
    address: '8 Rue de la Paix, Paris',
    city: 'Paris',
    imageUrl: null,
  },
  {
    name: 'Dr. Eva Bernard',
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
    it('returns all doctors ordered by name', async () => {
      const items = await repo.listBookable({ offset: 0, limit: 10 });
      expect(items).toHaveLength(5);
      expect(items[0].name).toBe('Dr. Alice Martin');
      expect(items[4].name).toBe('Dr. Eva Bernard');
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

    it('filters by search across name, specialty, and address', async () => {
      const items = await repo.listBookable({ search: 'derma', offset: 0, limit: 10 });
      expect(items).toHaveLength(2);
      expect(items.every((d) => d.specialty === 'Dermatology')).toBe(true);
    });

    it('search matches on name', async () => {
      const items = await repo.listBookable({ search: 'Alice', offset: 0, limit: 10 });
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Dr. Alice Martin');
    });

    it('search matches on address', async () => {
      const items = await repo.listBookable({ search: 'Haussmann', offset: 0, limit: 10 });
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Dr. Eva Bernard');
    });

    it('combines filters (specialty + city)', async () => {
      const items = await repo.listBookable({
        specialty: 'Cardiology',
        city: 'Paris',
        offset: 0,
        limit: 10,
      });
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Dr. Alice Martin');
    });

    it('paginates correctly', async () => {
      const page1 = await repo.listBookable({ offset: 0, limit: 2 });
      const page2 = await repo.listBookable({ offset: 2, limit: 2 });
      const page3 = await repo.listBookable({ offset: 4, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page3).toHaveLength(1);
      expect(page1[0].name).not.toBe(page2[0].name);
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
});
