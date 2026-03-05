import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockAppointmentsRepo } from '../../../test/repositories';

import { createAppointmentsService } from './appointments.service';

const service = createAppointmentsService(mockAppointmentsRepo);

const PATIENT_ID = 'patient-uuid-1';
const DOCTOR_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FUTURE_DATE = '2099-06-15';
const VALID_TIME = '10:00';

const fakeAppointment = {
  id: 'appt-uuid-1',
  doctorId: DOCTOR_ID,
  patientId: PATIENT_ID,
  date: FUTURE_DATE,
  time: VALID_TIME,
  status: 'PENDING' as const,
};

beforeEach(() => {
  vi.resetAllMocks();
  mockAppointmentsRepo.createAppointmentAtomic.mockResolvedValue({
    appointment: fakeAppointment,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('appointmentsService', () => {
  describe('createAppointment', () => {
    it('creates appointment successfully for future slot', async () => {
      const result = await service.createAppointment(PATIENT_ID, {
        doctorId: DOCTOR_ID,
        date: FUTURE_DATE,
        time: VALID_TIME,
      });

      expect(result).toEqual(fakeAppointment);
      expect(mockAppointmentsRepo.createAppointmentAtomic).toHaveBeenCalledWith({
        doctorId: DOCTOR_ID,
        patientId: PATIENT_ID,
        date: FUTURE_DATE,
        time: VALID_TIME,
        reason: undefined,
      });
    });

    it('passes reason to the repo', async () => {
      await service.createAppointment(PATIENT_ID, {
        doctorId: DOCTOR_ID,
        date: FUTURE_DATE,
        time: VALID_TIME,
        reason: 'Checkup',
      });

      expect(mockAppointmentsRepo.createAppointmentAtomic).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'Checkup' }),
      );
    });

    it('throws 422 for past date', async () => {
      await expect(
        service.createAppointment(PATIENT_ID, {
          doctorId: DOCTOR_ID,
          date: '2020-01-01',
          time: VALID_TIME,
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'UNPROCESSABLE_CONTENT' }));
      expect(mockAppointmentsRepo.createAppointmentAtomic).not.toHaveBeenCalled();
    });

    it('throws 422 for invalid time slot', async () => {
      await expect(
        service.createAppointment(PATIENT_ID, {
          doctorId: DOCTOR_ID,
          date: FUTURE_DATE,
          time: '10:15',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'UNPROCESSABLE_CONTENT' }));
    });

    it('throws 422 for break-time slot', async () => {
      await expect(
        service.createAppointment(PATIENT_ID, {
          doctorId: DOCTOR_ID,
          date: FUTURE_DATE,
          time: '12:30',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'UNPROCESSABLE_CONTENT' }));
    });

    it('throws 409 when slot is already booked', async () => {
      mockAppointmentsRepo.createAppointmentAtomic.mockResolvedValue({
        conflict: true as const,
      });

      await expect(
        service.createAppointment(PATIENT_ID, {
          doctorId: DOCTOR_ID,
          date: FUTURE_DATE,
          time: VALID_TIME,
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'CONFLICT' }));
    });

    it('throws 409 when slot is blocked by doctor', async () => {
      mockAppointmentsRepo.createAppointmentAtomic.mockResolvedValue({
        blocked: true as const,
      });

      await expect(
        service.createAppointment(PATIENT_ID, {
          doctorId: DOCTOR_ID,
          date: FUTURE_DATE,
          time: VALID_TIME,
        }),
      ).rejects.toThrow('blocked by the doctor');
    });
  });

  describe('listMyAppointments', () => {
    const fakeItems = [
      {
        ...fakeAppointment,
        reason: null,
        doctor: {
          id: DOCTOR_ID,
          name: 'Dr. Test',
          specialty: 'Cardiology',
          address: '1 Rue Test',
          imageUrl: null,
        },
      },
    ];

    beforeEach(() => {
      mockAppointmentsRepo.listByPatient.mockResolvedValue(fakeItems);
      mockAppointmentsRepo.countByPatient.mockResolvedValue(1);
    });

    it('returns paginated results with defaults', async () => {
      const result = await service.listMyAppointments(PATIENT_ID, {
        page: 1,
        limit: 20,
        sort: 'dateDesc',
      });

      expect(result).toEqual({
        items: fakeItems,
        page: 1,
        limit: 20,
        total: 1,
      });
      expect(mockAppointmentsRepo.listByPatient).toHaveBeenCalledWith({
        patientId: PATIENT_ID,
        status: undefined,
        from: undefined,
        to: undefined,
        offset: 0,
        limit: 20,
        sort: 'dateDesc',
      });
    });

    it('computes offset from page', async () => {
      await service.listMyAppointments(PATIENT_ID, {
        page: 3,
        limit: 10,
        sort: 'dateDesc',
      });

      expect(mockAppointmentsRepo.listByPatient).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20, limit: 10 }),
      );
    });

    it('passes filters to the repo', async () => {
      await service.listMyAppointments(PATIENT_ID, {
        status: 'PENDING',
        from: '2099-01-01',
        to: '2099-12-31',
        page: 1,
        limit: 20,
        sort: 'dateAsc',
      });

      expect(mockAppointmentsRepo.listByPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
          from: '2099-01-01',
          to: '2099-12-31',
          sort: 'dateAsc',
        }),
      );
    });

    it('throws BAD_REQUEST when from > to', async () => {
      await expect(
        service.listMyAppointments(PATIENT_ID, {
          from: '2099-12-31',
          to: '2099-01-01',
          page: 1,
          limit: 20,
          sort: 'dateDesc',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'BAD_REQUEST' }));
    });

    it('fetches items and count in parallel', async () => {
      await service.listMyAppointments(PATIENT_ID, {
        page: 1,
        limit: 20,
        sort: 'dateDesc',
      });

      expect(mockAppointmentsRepo.listByPatient).toHaveBeenCalledTimes(1);
      expect(mockAppointmentsRepo.countByPatient).toHaveBeenCalledTimes(1);
    });
  });
});
