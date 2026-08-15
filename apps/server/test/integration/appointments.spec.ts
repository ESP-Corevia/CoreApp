import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAdminUser,
  createDoctorUser,
  createIntegrationApp,
  createPatientUser,
  parisDate,
  resetIntegrationDb,
  type TestUser,
  trpcData,
  trpcError,
  trpcMutate,
  trpcQuery,
} from './harness';

// `vi.mock` is hoisted above these imports, so every module below resolves the
// database through the PGlite double.
vi.mock('../../src/db', () => import('./db.mock'));

interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  status: string;
}

/**
 * Journey: a patient books an appointment, the doctor confirms it, then completes it.
 *
 * Every call goes through HTTP → tRPC → services → repositories → PGlite, so slot rules,
 * ownership rules and status transitions are validated end to end.
 */
describe('integration: appointment booking journey', () => {
  let app: FastifyInstance;
  let patient: TestUser;
  let doctor: TestUser;

  const SLOT = '10:00';

  beforeAll(async () => {
    app = await createIntegrationApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetIntegrationDb();
    patient = await createPatientUser(app);
    doctor = await createDoctorUser(app);
  });

  function book(
    user: TestUser,
    overrides: { doctorId?: string; date?: string; time?: string; reason?: string } = {},
  ) {
    return trpcMutate(
      app,
      'appointments.create',
      {
        doctorId: overrides.doctorId ?? doctor.id,
        date: overrides.date ?? parisDate(7),
        time: overrides.time ?? SLOT,
        ...(overrides.reason ? { reason: overrides.reason } : {}),
      },
      user.cookie,
    );
  }

  describe('booking', () => {
    it('creates a PENDING appointment for the authenticated patient', async () => {
      const res = await book(patient, { reason: 'Chest pain' });

      expect(res.statusCode).toBe(200);
      expect(trpcData<Appointment>(res)).toMatchObject({
        doctorId: doctor.id,
        patientId: patient.id,
        time: SLOT,
        status: 'PENDING',
      });
    });

    it('lists the appointment in the patient own list', async () => {
      const created = trpcData<Appointment>(await book(patient));

      const res = await trpcQuery(app, 'appointments.listMine', {}, patient.cookie);

      const { items, total } = trpcData<{ items: Appointment[]; total: number }>(res);
      expect(total).toBe(1);
      expect(items[0]).toMatchObject({ id: created.id, status: 'PENDING' });
    });

    it('removes the booked slot from the doctor availability', async () => {
      const date = parisDate(7);
      await book(patient, { date });

      const res = await trpcQuery(
        app,
        'doctors.availableSlots',
        { doctorId: doctor.id, date },
        patient.cookie,
      );

      expect(trpcData<{ slots: string[] }>(res).slots).not.toContain(SLOT);
    });

    it('rejects a slot outside the 08:00–17:30 grid', async () => {
      const res = await book(patient, { time: '07:15' });

      expect(res.statusCode).toBe(422);
      expect(trpcError(res)).toMatchObject({
        code: 'UNPROCESSABLE_CONTENT',
        message: expect.stringContaining('Invalid time slot'),
      });
    });

    it('rejects a slot inside the lunch break', async () => {
      const res = await book(patient, { time: '12:30' });

      expect(res.statusCode).toBe(422);
      expect(trpcError(res).message).toContain('Invalid time slot');
    });

    it('rejects a date in the past', async () => {
      const res = await book(patient, { date: parisDate(-1) });

      expect(res.statusCode).toBe(422);
      expect(trpcError(res).message).toBe('Cannot book an appointment in the past');
    });

    it('rejects a second booking on the same doctor slot', async () => {
      const date = parisDate(7);
      await book(patient, { date });
      const other = await createPatientUser(app);

      const res = await book(other, { date });

      expect(res.statusCode).toBe(409);
      expect(trpcError(res)).toMatchObject({
        code: 'CONFLICT',
        message: 'This time slot is already booked',
      });
    });

    it('rejects a malformed date', async () => {
      const res = await book(patient, { date: '15/06/2099' });

      expect(res.statusCode).toBe(400);
      expect(trpcError(res).message).toContain('date must be YYYY-MM-DD');
    });

    it('rejects a malformed time', async () => {
      const res = await book(patient, { time: '9h30' });

      expect(res.statusCode).toBe(400);
      expect(trpcError(res).message).toContain('time must be HH:mm');
    });

    it('rejects a doctorId that is not a UUID', async () => {
      const res = await book(patient, { doctorId: 'not-a-uuid' });

      expect(res.statusCode).toBe(400);
    });

    it('rejects an unauthenticated booking', async () => {
      const res = await trpcMutate(app, 'appointments.create', {
        doctorId: doctor.id,
        date: parisDate(7),
        time: SLOT,
      });

      expect(res.statusCode).toBe(401);
      expect(trpcError(res).message).toBe('Authentication required');
    });

    it('rejects a doctor booking through the patient endpoint', async () => {
      const res = await book(doctor);

      expect(res.statusCode).toBe(403);
      expect(trpcError(res).message).toBe('Patient access required');
    });
  });

  describe('doctor review', () => {
    it('exposes the pending appointment to the assigned doctor', async () => {
      const created = trpcData<Appointment>(await book(patient));

      const res = await trpcQuery(app, 'doctor.appointments.listMine', {}, doctor.cookie);

      const { items } = trpcData<{ items: Appointment[] }>(res);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(created.id);
    });

    it('confirms a pending appointment', async () => {
      const created = trpcData<Appointment>(await book(patient));

      const res = await trpcMutate(
        app,
        'doctor.appointments.updateStatus',
        { id: created.id, status: 'CONFIRMED' },
        doctor.cookie,
      );

      expect(res.statusCode).toBe(200);
      expect(trpcData<Appointment>(res).status).toBe('CONFIRMED');
    });

    it('completes an appointment that was confirmed first', async () => {
      const created = trpcData<Appointment>(await book(patient));
      await trpcMutate(
        app,
        'doctor.appointments.updateStatus',
        { id: created.id, status: 'CONFIRMED' },
        doctor.cookie,
      );

      const res = await trpcMutate(
        app,
        'doctor.appointments.updateStatus',
        { id: created.id, status: 'COMPLETED' },
        doctor.cookie,
      );

      expect(trpcData<Appointment>(res).status).toBe('COMPLETED');
    });

    it('rejects completing an appointment that is still pending', async () => {
      const created = trpcData<Appointment>(await book(patient));

      const res = await trpcMutate(
        app,
        'doctor.appointments.updateStatus',
        { id: created.id, status: 'COMPLETED' },
        doctor.cookie,
      );

      expect(res.statusCode).toBe(400);
      expect(trpcError(res).message).toBe('Cannot transition from PENDING to COMPLETED');
    });

    it('rejects an unsupported status value', async () => {
      const created = trpcData<Appointment>(await book(patient));

      const res = await trpcMutate(
        app,
        'doctor.appointments.updateStatus',
        { id: created.id, status: 'PENDING' },
        doctor.cookie,
      );

      expect(res.statusCode).toBe(400);
    });

    it('rejects a doctor acting on another doctor appointment', async () => {
      const created = trpcData<Appointment>(await book(patient));
      const otherDoctor = await createDoctorUser(app, { specialty: 'Dermatology' });

      const res = await trpcMutate(
        app,
        'doctor.appointments.updateStatus',
        { id: created.id, status: 'CONFIRMED' },
        otherDoctor.cookie,
      );

      expect(res.statusCode).toBe(403);
      expect(trpcError(res).message).toBe('You do not have access to this appointment');
    });

    it('reports NOT_FOUND for an unknown appointment id', async () => {
      const res = await trpcMutate(
        app,
        'doctor.appointments.updateStatus',
        { id: '00000000-0000-4000-8000-000000000000', status: 'CONFIRMED' },
        doctor.cookie,
      );

      expect(res.statusCode).toBe(404);
      expect(trpcError(res).message).toBe('Appointment not found');
    });
  });

  describe('appointment detail access', () => {
    it('returns the detail to the patient who booked it', async () => {
      const created = trpcData<Appointment>(await book(patient));

      const res = await trpcQuery(app, 'appointments.detail', { id: created.id }, patient.cookie);

      expect(trpcData<{ id: string; doctor: { specialty: string } }>(res)).toMatchObject({
        id: created.id,
        doctor: { specialty: 'Cardiology' },
      });
    });

    it('hides the detail from another patient', async () => {
      const created = trpcData<Appointment>(await book(patient));
      const other = await createPatientUser(app);

      const res = await trpcQuery(app, 'appointments.detail', { id: created.id }, other.cookie);

      expect(res.statusCode).toBe(403);
      expect(trpcError(res).message).toBe('You do not have access to this appointment');
    });

    it('lets an admin read any appointment detail', async () => {
      const created = trpcData<Appointment>(await book(patient));
      const admin = await createAdminUser(app);

      const res = await trpcQuery(app, 'appointments.detail', { id: created.id }, admin.cookie);

      expect(res.statusCode).toBe(200);
      expect(trpcData<{ id: string }>(res).id).toBe(created.id);
    });

    it('reports NOT_FOUND for an appointment that does not exist', async () => {
      const res = await trpcQuery(
        app,
        'appointments.detail',
        { id: '00000000-0000-4000-8000-000000000000' },
        patient.cookie,
      );

      expect(res.statusCode).toBe(404);
      expect(trpcError(res).message).toBe('Appointment not found');
    });
  });

  describe('listing filters', () => {
    it('filters the patient list by status', async () => {
      const confirmed = trpcData<Appointment>(await book(patient, { time: '09:00' }));
      await book(patient, { time: '11:00' });
      await trpcMutate(
        app,
        'doctor.appointments.updateStatus',
        { id: confirmed.id, status: 'CONFIRMED' },
        doctor.cookie,
      );

      const res = await trpcQuery(
        app,
        'appointments.listMine',
        { status: 'CONFIRMED' },
        patient.cookie,
      );

      const { items } = trpcData<{ items: Appointment[] }>(res);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(confirmed.id);
    });

    it('rejects an inverted date range', async () => {
      const res = await trpcQuery(
        app,
        'appointments.listMine',
        { from: parisDate(10), to: parisDate(2) },
        patient.cookie,
      );

      expect(res.statusCode).toBe(400);
      expect(trpcError(res).message).toBe('"from" must be before or equal to "to"');
    });

    it('returns an empty page when the patient has no appointment', async () => {
      const res = await trpcQuery(app, 'appointments.listMine', {}, patient.cookie);

      expect(trpcData<{ items: Appointment[]; total: number }>(res)).toMatchObject({
        items: [],
        total: 0,
      });
    });

    it('does not leak appointments of other patients', async () => {
      await book(patient);
      const other = await createPatientUser(app);

      const res = await trpcQuery(app, 'appointments.listMine', {}, other.cookie);

      expect(trpcData<{ total: number }>(res).total).toBe(0);
    });
  });

  describe('bookable doctors', () => {
    it('lists a verified doctor', async () => {
      const res = await trpcQuery(app, 'doctors.list', {}, patient.cookie);

      const { items } = trpcData<{ items: { userId: string }[] }>(res);
      expect(items.map(item => item.userId)).toContain(doctor.id);
    });

    it('hides an unverified doctor', async () => {
      const unverified = await createDoctorUser(app, { verified: false, city: 'Lyon' });

      const res = await trpcQuery(app, 'doctors.list', {}, patient.cookie);

      const { items } = trpcData<{ items: { userId: string }[] }>(res);
      expect(items.map(item => item.userId)).not.toContain(unverified.id);
    });

    it('filters by city', async () => {
      await createDoctorUser(app, { city: 'Lyon', specialty: 'Dermatology' });

      const res = await trpcQuery(app, 'doctors.list', { city: 'Lyon' }, patient.cookie);

      const { items } = trpcData<{ items: { city: string }[] }>(res);
      expect(items).toHaveLength(1);
      expect(items[0].city).toBe('Lyon');
    });

    it('rejects a page size above the allowed maximum', async () => {
      const res = await trpcQuery(app, 'doctors.list', { limit: 500 }, patient.cookie);

      expect(res.statusCode).toBe(400);
    });
  });
});
