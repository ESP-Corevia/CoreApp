import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { appointments, doctorBlocks, doctors, users } from '../schema';

import { createAvailabilityRepo } from './availability.repository';

const repo = createAvailabilityRepo(db as any);

let doctorId: string;
const TEST_DATE = '2026-06-15';

beforeAll(async () => {
  await applyMigration();
});

beforeEach(async () => {
  await resetDb();

  // Seed a user (needed as FK for appointments.patientId)
  const [user] = await db
    .insert(users)
    .values({
      name: 'Patient Test',
      email: 'patient@test.com',
      emailVerified: true,
      createdAt: new Date(),
    })
    .returning({ id: users.id });

  // Seed a doctor
  const [doctor] = await db
    .insert(doctors)
    .values({
      name: 'Dr. Test',
      specialty: 'Cardiology',
      address: '1 Rue de Test, Paris',
      city: 'Paris',
    })
    .returning({ id: doctors.id });
  doctorId = doctor.id;

  // Seed a PENDING appointment at 10:00
  await db.insert(appointments).values({
    doctorId,
    patientId: user.id,
    date: TEST_DATE,
    time: '10:00',
    status: 'PENDING',
  });

  // Seed a CONFIRMED appointment at 14:00
  await db.insert(appointments).values({
    doctorId,
    patientId: user.id,
    date: TEST_DATE,
    time: '14:00',
    status: 'CONFIRMED',
  });

  // Seed a CANCELLED appointment at 15:00 (should NOT be excluded)
  await db.insert(appointments).values({
    doctorId,
    patientId: user.id,
    date: TEST_DATE,
    time: '15:00',
    status: 'CANCELLED',
  });

  // Seed a block at 11:30
  await db.insert(doctorBlocks).values({
    doctorId,
    date: TEST_DATE,
    time: '11:30',
    reason: 'Personal',
  });
});

describe('availability.repository', () => {
  describe('doctorExists', () => {
    it('returns true for existing doctor', async () => {
      expect(await repo.doctorExists(doctorId)).toBe(true);
    });

    it('returns false for non-existing doctor', async () => {
      expect(await repo.doctorExists('00000000-0000-0000-0000-000000000000')).toBe(false);
    });
  });

  describe('getReservedSlots', () => {
    it('returns only PENDING and CONFIRMED slots', async () => {
      const slots = await repo.getReservedSlots(doctorId, TEST_DATE);
      expect(slots).toContain('10:00');
      expect(slots).toContain('14:00');
      expect(slots).not.toContain('15:00'); // CANCELLED
      expect(slots).toHaveLength(2);
    });

    it('returns empty for a date with no appointments', async () => {
      const slots = await repo.getReservedSlots(doctorId, '2026-01-01');
      expect(slots).toEqual([]);
    });
  });

  describe('getBlockedSlots', () => {
    it('returns blocked time slots', async () => {
      const slots = await repo.getBlockedSlots(doctorId, TEST_DATE);
      expect(slots).toContain('11:30');
      expect(slots).toHaveLength(1);
    });

    it('returns empty for a date with no blocks', async () => {
      const slots = await repo.getBlockedSlots(doctorId, '2026-01-01');
      expect(slots).toEqual([]);
    });
  });
});
