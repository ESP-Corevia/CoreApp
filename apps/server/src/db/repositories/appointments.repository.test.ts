import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { appointments, doctorBlocks, doctors, users } from '../schema';

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

  describe('getByIdWithDoctor', () => {
    it('returns the appointment with doctor info', async () => {
      const created = await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '10:00',
        reason: 'Checkup',
      });
      const apptId = ('appointment' in created && created.appointment?.id) as string;

      const result = await repo.getByIdWithDoctor(apptId);

      expect(result).not.toBeNull();
      expect(result.id).toBe(apptId);
      expect(result.doctorId).toBe(doctorId);
      expect(result.patientId).toBe(patientId);
      expect(result.date).toBe(TEST_DATE);
      expect(result.time).toBe('10:00');
      expect(result.status).toBe('PENDING');
      expect(result.reason).toBe('Checkup');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.doctor.specialty).toBe('Cardiology');
    });

    it('returns null for non-existing id', async () => {
      const result = await repo.getByIdWithDoctor('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99');
      expect(result).toBeNull();
    });
  });

  describe('listByPatient', () => {
    beforeEach(async () => {
      // Seed 3 appointments for patient on different dates/statuses
      await db.insert(appointments).values([
        {
          doctorId,
          patientId,
          date: '2099-06-10',
          time: '10:00',
          status: 'PENDING',
          reason: 'Checkup',
        },
        {
          doctorId,
          patientId,
          date: '2099-06-15',
          time: '14:00',
          status: 'CONFIRMED',
        },
        {
          doctorId,
          patientId,
          date: '2099-06-20',
          time: '09:00',
          status: 'CANCELLED',
        },
      ]);
    });

    it('returns all appointments for a patient with doctor info', async () => {
      const items = await repo.listByPatient({
        patientId,
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(3);
      expect(items[0].date).toBe('2099-06-10');
      expect(items[0].doctor.specialty).toBe('Cardiology');
    });

    it('filters by status', async () => {
      const items = await repo.listByPatient({
        patientId,
        status: 'PENDING',
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(1);
      expect(items[0].status).toBe('PENDING');
    });

    it('filters by date range', async () => {
      const items = await repo.listByPatient({
        patientId,
        from: '2099-06-12',
        to: '2099-06-18',
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(1);
      expect(items[0].date).toBe('2099-06-15');
    });

    it('sorts dateDesc', async () => {
      const items = await repo.listByPatient({
        patientId,
        offset: 0,
        limit: 10,
        sort: 'dateDesc',
      });

      expect(items[0].date).toBe('2099-06-20');
      expect(items[2].date).toBe('2099-06-10');
    });

    it('paginates with offset/limit', async () => {
      const items = await repo.listByPatient({
        patientId,
        offset: 1,
        limit: 1,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(1);
      expect(items[0].date).toBe('2099-06-15');
    });

    it('isolates by patient - other user sees nothing', async () => {
      const [otherUser] = await db
        .insert(users)
        .values({
          name: 'Other Patient',
          email: 'other@test.com',
          emailVerified: true,
          createdAt: new Date(),
        })
        .returning({ id: users.id });

      const items = await repo.listByPatient({
        patientId: otherUser.id,
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(0);
    });
  });

  describe('countByPatient', () => {
    beforeEach(async () => {
      await db.insert(appointments).values([
        { doctorId, patientId, date: '2099-06-10', time: '10:00', status: 'PENDING' },
        { doctorId, patientId, date: '2099-06-15', time: '14:00', status: 'CONFIRMED' },
        { doctorId, patientId, date: '2099-06-20', time: '09:00', status: 'CANCELLED' },
      ]);
    });

    it('counts all appointments for a patient', async () => {
      const count = await repo.countByPatient({ patientId });
      expect(count).toBe(3);
    });

    it('counts with status filter', async () => {
      const count = await repo.countByPatient({ patientId, status: 'PENDING' });
      expect(count).toBe(1);
    });

    it('counts with date range', async () => {
      const count = await repo.countByPatient({
        patientId,
        from: '2099-06-12',
        to: '2099-06-18',
      });
      expect(count).toBe(1);
    });
  });

  describe('listAll', () => {
    let doctor2Id: string;
    let patient2Id: string;

    beforeEach(async () => {
      const [patient2] = await db
        .insert(users)
        .values({
          name: 'Jane Smith',
          email: 'jane@test.com',
          emailVerified: true,
          createdAt: new Date(),
        })
        .returning({ id: users.id });
      patient2Id = patient2.id;

      const [doctorUser] = await db
        .insert(users)
        .values({
          name: 'Dr. Watson',
          email: 'watson@test.com',
          emailVerified: true,
          createdAt: new Date(),
        })
        .returning({ id: users.id });

      const [doc2] = await db
        .insert(doctors)
        .values({
          userId: doctorUser.id,
          specialty: 'Dermatology',
          address: '5 Rue Test, Lyon',
          city: 'Lyon',
        })
        .returning({ id: doctors.id });
      doctor2Id = doc2.id;

      await db.insert(appointments).values([
        {
          doctorId,
          patientId,
          date: '2099-06-10',
          time: '10:00',
          status: 'PENDING',
          reason: 'Checkup',
        },
        {
          doctorId,
          patientId: patient2Id,
          date: '2099-06-15',
          time: '14:00',
          status: 'CONFIRMED',
        },
        {
          doctorId: doctor2Id,
          patientId,
          date: '2099-06-20',
          time: '09:00',
          status: 'CANCELLED',
        },
      ]);
    });

    it('returns all appointments with doctor and patient names', async () => {
      const items = await repo.listAll({ offset: 0, limit: 10, sort: 'dateAsc' });

      expect(items).toHaveLength(3);
      expect(items[0].date).toBe('2099-06-10');
      expect(items[0].patientName).toBe('Patient Test');
      expect(items[2].doctorName).toBe('Dr. Watson');
    });

    it('filters by status', async () => {
      const items = await repo.listAll({
        status: 'PENDING',
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(1);
      expect(items[0].status).toBe('PENDING');
    });

    it('filters by date range', async () => {
      const items = await repo.listAll({
        from: '2099-06-12',
        to: '2099-06-18',
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(1);
      expect(items[0].date).toBe('2099-06-15');
    });

    it('filters by doctorId', async () => {
      const items = await repo.listAll({
        doctorId: doctor2Id,
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(1);
      expect(items[0].doctorId).toBe(doctor2Id);
    });

    it('filters by search on patient name', async () => {
      const items = await repo.listAll({
        search: 'Jane',
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(items).toHaveLength(1);
      expect(items[0].patientName).toBe('Jane Smith');
    });

    it('sorts dateDesc', async () => {
      const items = await repo.listAll({ offset: 0, limit: 10, sort: 'dateDesc' });

      expect(items[0].date).toBe('2099-06-20');
      expect(items[2].date).toBe('2099-06-10');
    });

    it('sorts createdAtDesc', async () => {
      const items = await repo.listAll({ offset: 0, limit: 10, sort: 'createdAtDesc' });
      expect(items).toHaveLength(3);
    });

    it('paginates with offset/limit', async () => {
      const items = await repo.listAll({ offset: 1, limit: 1, sort: 'dateAsc' });

      expect(items).toHaveLength(1);
      expect(items[0].date).toBe('2099-06-15');
    });
  });

  describe('countAll', () => {
    beforeEach(async () => {
      await db.insert(appointments).values([
        { doctorId, patientId, date: '2099-06-10', time: '10:00', status: 'PENDING' },
        { doctorId, patientId, date: '2099-06-15', time: '14:00', status: 'CONFIRMED' },
        { doctorId, patientId, date: '2099-06-20', time: '09:00', status: 'CANCELLED' },
      ]);
    });

    it('counts all appointments', async () => {
      const count = await repo.countAll({});
      expect(count).toBe(3);
    });

    it('counts with status filter', async () => {
      const count = await repo.countAll({ status: 'PENDING' });
      expect(count).toBe(1);
    });

    it('counts with date range', async () => {
      const count = await repo.countAll({ from: '2099-06-12', to: '2099-06-18' });
      expect(count).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('updates the status and returns the row', async () => {
      const created = await repo.createAppointmentAtomic({
        doctorId,
        patientId,
        date: TEST_DATE,
        time: '10:00',
      });
      const apptId = ('appointment' in created && created.appointment?.id) as string;

      const result = await repo.updateStatus(apptId, 'CONFIRMED');

      expect(result).not.toBeNull();
      expect(result!.id).toBe(apptId);
      expect(result!.status).toBe('CONFIRMED');
    });

    it('returns null for non-existing id', async () => {
      const result = await repo.updateStatus('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'CONFIRMED');
      expect(result).toBeNull();
    });
  });
});
