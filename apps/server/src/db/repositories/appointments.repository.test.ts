import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { doctorBlocks, doctors, users } from '../schema';

import { createAppointmentsRepo } from './appointments.repository';

const repo = createAppointmentsRepo(db as any);

let doctorId: string;
let patientId: string;
const TEST_DATE = '2099-06-15';

beforeAll(async () => {
  await applyMigration();
});

beforeEach(async () => {
  await resetDb();

  const [user] = await db
    .insert(users)
    .values({
      name: 'Patient Test',
      email: 'patient@test.com',
      emailVerified: true,
      createdAt: new Date(),
    })
    .returning({ id: users.id });
  patientId = user.id;

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
});

describe('appointments.repository', () => {
  describe('createAppointmentAtomic', () => {
    it('creates a PENDING appointment', async () => {
      const result = await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '10:00',
      });

      expect(result).toHaveProperty('appointment');
      expect(result.appointment?.status).toBe('PENDING');
      expect(result.appointment?.doctorId).toBe(doctorId);
      expect(result.appointment?.patientId).toBe(patientId);
      expect(result.appointment?.date).toBe(TEST_DATE);
      expect(result.appointment?.time).toBe('10:00');
      expect(result.appointment?.id).toBeDefined();
    });

    it('returns conflict when same slot is already booked', async () => {
      // First booking
      await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '10:00',
      });

      // Second booking on same slot
      const result = await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '10:00',
      });

      expect(result).toHaveProperty('conflict', true);
    });

    it('allows booking different time slots', async () => {
      await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '10:00',
      });

      const result = await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '10:30',
      });

      expect(result).toHaveProperty('appointment');
    });

    it('returns blocked when slot has a doctor block', async () => {
      await db.insert(doctorBlocks).values({
        doctorId,
        date: TEST_DATE,
        time: '11:00',
        reason: 'Personal',
      });

      const result = await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '11:00',
      });

      expect(result).toHaveProperty('blocked', true);
    });

    it('passes reason through to the appointment', async () => {
      const result = await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '14:00',
        reason: 'Annual checkup',
      });

      expect(result).toHaveProperty('appointment');
    });
  });
});
