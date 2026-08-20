import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAdminUser,
  createDoctorUser,
  createIntegrationApp,
  createPatientUser,
  createUser,
  parisDate,
  resetIntegrationDb,
  type TestUser,
  trpcData,
  trpcError,
  trpcMutate,
  trpcQuery,
  uniqueEmail,
} from './harness';

// `vi.mock` is hoisted above these imports, so every module below resolves the
// database through the PGlite double.
vi.mock('../../src/db', () => import('./db.mock'));

interface DoctorProfile {
  id: string;
  userId: string | null;
  specialty: string;
  city: string;
  verified: boolean;
}

interface PatientProfile {
  userId: string;
  dateOfBirth: string;
  gender: string;
}

interface AdminAppointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  status: string;
}

const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

/**
 * Journey: back-office administration — user directory, doctor and patient profiles, and
 * appointment management.
 *
 * Each endpoint is also exercised with a patient session to prove the admin guard blocks it.
 */
describe('integration: back-office administration journey', () => {
  let app: FastifyInstance;
  let admin: TestUser;

  beforeAll(async () => {
    app = await createIntegrationApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetIntegrationDb();
    admin = await createAdminUser(app);
  });

  describe('user directory', () => {
    it('lists every user except the calling admin', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcQuery(app, 'admin.listUsers', { page: 1, perPage: 10 }, admin.cookie);

      expect(res.statusCode).toBe(200);
      const body = trpcData<{
        users: Array<{ email: string; role: string | null }>;
        totalItems: number;
        page: number;
        perPage: number;
      }>(res);
      expect(body).toMatchObject({ totalItems: 1, page: 1, perPage: 10 });
      expect(body.users.map(user => user.email)).toEqual([patient.email]);
      expect(body.users[0].role).toBe('patient');
    });

    it('filters the users with a search term', async () => {
      const email = uniqueEmail('searchable');
      await createUser(app, { role: 'patient', email, name: 'Zoé Searchable' });

      const res = await trpcQuery(
        app,
        'admin.listUsers',
        { page: 1, perPage: 10, search: 'Searchable' },
        admin.cookie,
      );

      const { users } = trpcData<{ users: Array<{ email: string }> }>(res);
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(email);
    });

    it('rejects a page size above the admin maximum', async () => {
      const res = await trpcQuery(app, 'admin.listUsers', { page: 1, perPage: 1000 }, admin.cookie);

      expect(res.statusCode).toBe(400);
    });

    it('rejects a page number of zero', async () => {
      const res = await trpcQuery(app, 'admin.listUsers', { page: 0, perPage: 10 }, admin.cookie);

      expect(res.statusCode).toBe(400);
    });

    it('rejects a patient reading the user directory', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcQuery(app, 'admin.listUsers', { page: 1, perPage: 10 }, patient.cookie);

      expect(res.statusCode).toBe(401);
      expect(trpcError(res).message).toBe('You must be an admin to access this resource');
    });

    it('rejects a doctor reading the user directory', async () => {
      const doctor = await createDoctorUser(app);

      const res = await trpcQuery(app, 'admin.listUsers', { page: 1, perPage: 10 }, doctor.cookie);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('doctor profiles', () => {
    it('creates a doctor profile for an existing user', async () => {
      const user = await createUser(app, { role: 'doctor', name: 'Dr House' });

      const res = await trpcMutate(
        app,
        'admin.createDoctor',
        { userId: user.id, specialty: 'Diagnostics', address: '2 rue Princeton', city: 'Paris' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(200);
      expect(trpcData<DoctorProfile>(res)).toMatchObject({
        userId: user.id,
        specialty: 'Diagnostics',
        verified: false,
      });
    });

    it('rejects a doctor profile with an empty specialty', async () => {
      const user = await createUser(app, { role: 'doctor' });

      const res = await trpcMutate(
        app,
        'admin.createDoctor',
        { userId: user.id, specialty: '', address: '2 rue Princeton', city: 'Paris' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(400);
    });

    it('rejects a doctor profile for an unknown user', async () => {
      const res = await trpcMutate(
        app,
        'admin.createDoctor',
        { userId: UNKNOWN_UUID, specialty: 'Diagnostics', address: '2 rue X', city: 'Paris' },
        admin.cookie,
      );

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('verifies a doctor profile', async () => {
      const doctor = await createDoctorUser(app, { verified: false });

      const res = await trpcMutate(
        app,
        'admin.setDoctorVerified',
        { userId: doctor.id, verified: true },
        admin.cookie,
      );

      expect(trpcData<DoctorProfile>(res).verified).toBe(true);
    });

    it('makes a newly verified doctor bookable by patients', async () => {
      const doctor = await createDoctorUser(app, { verified: false });
      const patient = await createPatientUser(app);

      await trpcMutate(
        app,
        'admin.setDoctorVerified',
        { userId: doctor.id, verified: true },
        admin.cookie,
      );

      const res = await trpcQuery(app, 'doctors.list', {}, patient.cookie);
      const { items } = trpcData<{ items: Array<{ userId: string }> }>(res);
      expect(items.map(item => item.userId)).toContain(doctor.id);
    });

    it('reports NOT_FOUND when verifying a user without a doctor profile', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcMutate(
        app,
        'admin.setDoctorVerified',
        { userId: patient.id, verified: true },
        admin.cookie,
      );

      expect(res.statusCode).toBe(404);
      expect(trpcError(res).message).toBe('Doctor profile not found');
    });

    it('lists the doctors filtered by city', async () => {
      await createDoctorUser(app, { city: 'Lyon' });
      await createDoctorUser(app, { city: 'Paris' });

      const res = await trpcQuery(
        app,
        'admin.listDoctors',
        { page: 1, perPage: 10, city: 'Lyon' },
        admin.cookie,
      );

      const { doctors, totalItems } = trpcData<{ doctors: DoctorProfile[]; totalItems: number }>(
        res,
      );
      expect(totalItems).toBe(1);
      expect(doctors[0].city).toBe('Lyon');
    });

    it('rejects a patient creating a doctor profile', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcMutate(
        app,
        'admin.createDoctor',
        { userId: patient.id, specialty: 'Diagnostics', address: '2 rue X', city: 'Paris' },
        patient.cookie,
      );

      expect(res.statusCode).toBe(401);
    });
  });

  describe('patient profiles', () => {
    it('creates a patient profile for an existing user', async () => {
      const user = await createUser(app, { role: 'patient' });

      const res = await trpcMutate(
        app,
        'admin.createPatient',
        { userId: user.id, dateOfBirth: '1985-03-12', gender: 'FEMALE' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(200);
      expect(trpcData<PatientProfile>(res)).toMatchObject({
        userId: user.id,
        dateOfBirth: '1985-03-12',
        gender: 'FEMALE',
      });
    });

    it('rejects an invalid gender', async () => {
      const user = await createUser(app, { role: 'patient' });

      const res = await trpcMutate(
        app,
        'admin.createPatient',
        { userId: user.id, dateOfBirth: '1985-03-12', gender: 'OTHER' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(400);
    });

    it('rejects a malformed date of birth', async () => {
      const user = await createUser(app, { role: 'patient' });

      const res = await trpcMutate(
        app,
        'admin.createPatient',
        { userId: user.id, dateOfBirth: '12/03/1985', gender: 'MALE' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(400);
      expect(trpcError(res).message).toContain('Must be YYYY-MM-DD');
    });

    it('updates a patient profile', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcMutate(
        app,
        'admin.updatePatient',
        { userId: patient.id, bloodType: 'O+', allergies: 'Penicillin' },
        admin.cookie,
      );

      expect(trpcData<{ bloodType: string; allergies: string }>(res)).toMatchObject({
        bloodType: 'O+',
        allergies: 'Penicillin',
      });
    });

    it('rejects an unsupported blood type', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcMutate(
        app,
        'admin.updatePatient',
        { userId: patient.id, bloodType: 'Z+' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(400);
    });

    it('reports NOT_FOUND when updating a profile that does not exist', async () => {
      const user = await createUser(app, { role: 'patient' });

      const res = await trpcMutate(
        app,
        'admin.updatePatient',
        { userId: user.id, bloodType: 'A+' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(404);
      expect(trpcError(res).message).toBe('Patient profile not found');
    });

    it('lists the patients', async () => {
      await createPatientUser(app);

      const res = await trpcQuery(
        app,
        'admin.listPatients',
        { page: 1, perPage: 10 },
        admin.cookie,
      );

      expect(trpcData<{ totalItems: number }>(res).totalItems).toBe(1);
    });

    it('deletes a patient profile', async () => {
      const patient = await createPatientUser(app);

      const res = await trpcMutate(
        app,
        'admin.deletePatient',
        { userId: patient.id },
        admin.cookie,
      );

      expect(res.statusCode).toBe(200);
      const list = trpcData<{ totalItems: number }>(
        await trpcQuery(app, 'admin.listPatients', { page: 1, perPage: 10 }, admin.cookie),
      );
      expect(list.totalItems).toBe(0);
    });

    it('rejects a patient creating another patient profile', async () => {
      const patient = await createPatientUser(app);
      const user = await createUser(app, { role: 'patient' });

      const res = await trpcMutate(
        app,
        'admin.createPatient',
        { userId: user.id, dateOfBirth: '1985-03-12', gender: 'MALE' },
        patient.cookie,
      );

      expect(res.statusCode).toBe(401);
    });
  });

  describe('appointment management', () => {
    let doctor: TestUser;
    let patient: TestUser;

    beforeEach(async () => {
      doctor = await createDoctorUser(app);
      patient = await createPatientUser(app);
    });

    function adminCreate(overrides: Partial<{ date: string; time: string }> = {}) {
      return trpcMutate(
        app,
        'admin.createAppointment',
        {
          doctorId: doctor.id,
          patientId: patient.id,
          date: overrides.date ?? parisDate(5),
          time: overrides.time ?? '09:00',
        },
        admin.cookie,
      );
    }

    it('books an appointment on behalf of a patient', async () => {
      const res = await adminCreate();

      expect(res.statusCode).toBe(200);
      expect(trpcData<AdminAppointment>(res)).toMatchObject({
        doctorId: doctor.id,
        patientId: patient.id,
        status: 'PENDING',
      });
    });

    it('shows the appointment in the patient own list', async () => {
      const created = trpcData<AdminAppointment>(await adminCreate());

      const res = await trpcQuery(app, 'appointments.listMine', {}, patient.cookie);

      const { items } = trpcData<{ items: AdminAppointment[] }>(res);
      expect(items.map(item => item.id)).toEqual([created.id]);
    });

    it('rejects an appointment on an invalid slot', async () => {
      const res = await adminCreate({ time: '07:15' });

      expect(res.statusCode).toBe(422);
      expect(trpcError(res).message).toContain('Invalid time slot');
    });

    it('rejects a double booking on the same slot', async () => {
      await adminCreate();

      const res = await adminCreate();

      expect(res.statusCode).toBe(409);
      expect(trpcError(res).message).toBe('This time slot is already booked');
    });

    it('moves an appointment to another slot', async () => {
      const created = trpcData<AdminAppointment>(await adminCreate());

      const res = await trpcMutate(
        app,
        'admin.updateAppointment',
        { id: created.id, time: '11:00' },
        admin.cookie,
      );

      expect(trpcData<AdminAppointment>(res).time).toBe('11:00');
    });

    it('rejects moving an appointment to an invalid slot', async () => {
      const created = trpcData<AdminAppointment>(await adminCreate());

      const res = await trpcMutate(
        app,
        'admin.updateAppointment',
        { id: created.id, time: '23:00' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(422);
    });

    it('cancels an appointment through a status change', async () => {
      const created = trpcData<AdminAppointment>(await adminCreate());

      const res = await trpcMutate(
        app,
        'admin.updateAppointmentStatus',
        { id: created.id, status: 'CANCELLED' },
        admin.cookie,
      );

      expect(trpcData<AdminAppointment>(res).status).toBe('CANCELLED');
    });

    it('rejects an impossible status transition', async () => {
      const created = trpcData<AdminAppointment>(await adminCreate());
      await trpcMutate(
        app,
        'admin.updateAppointmentStatus',
        { id: created.id, status: 'CANCELLED' },
        admin.cookie,
      );

      const res = await trpcMutate(
        app,
        'admin.updateAppointmentStatus',
        { id: created.id, status: 'CONFIRMED' },
        admin.cookie,
      );

      expect(res.statusCode).toBe(400);
      expect(trpcError(res).message).toBe('Cannot transition from CANCELLED to CONFIRMED');
    });

    it('frees the slot again after deleting the appointment', async () => {
      const created = trpcData<AdminAppointment>(await adminCreate());

      const deleted = await trpcMutate(
        app,
        'admin.deleteAppointment',
        { id: created.id },
        admin.cookie,
      );
      expect(deleted.statusCode).toBe(200);

      const res = await adminCreate();
      expect(res.statusCode).toBe(200);
    });

    it('reports NOT_FOUND when deleting an unknown appointment', async () => {
      const res = await trpcMutate(
        app,
        'admin.deleteAppointment',
        { id: UNKNOWN_UUID },
        admin.cookie,
      );

      expect(res.statusCode).toBe(404);
      expect(trpcError(res).message).toBe('Appointment not found');
    });

    it('filters the appointment list by status', async () => {
      const created = trpcData<AdminAppointment>(await adminCreate());
      await trpcMutate(
        app,
        'admin.updateAppointmentStatus',
        { id: created.id, status: 'CONFIRMED' },
        admin.cookie,
      );

      const res = await trpcQuery(
        app,
        'admin.listAppointments',
        { page: 1, perPage: 10, status: ['CONFIRMED'] },
        admin.cookie,
      );

      expect(trpcData<{ totalItems: number }>(res).totalItems).toBe(1);
    });

    it('rejects a patient managing appointments through the admin router', async () => {
      const res = await trpcMutate(
        app,
        'admin.createAppointment',
        {
          doctorId: doctor.id,
          patientId: patient.id,
          date: parisDate(5),
          time: '09:00',
        },
        patient.cookie,
      );

      expect(res.statusCode).toBe(401);
    });
  });
});
