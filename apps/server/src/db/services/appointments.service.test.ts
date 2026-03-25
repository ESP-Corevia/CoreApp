/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
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

  describe('getAppointmentDetail', () => {
    const APPT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    const fakeDetail = {
      ...fakeAppointment,
      id: APPT_ID,
      reason: null,
      createdAt: new Date('2099-06-15T08:00:00Z'),
      updatedAt: null,
      doctor: {
        id: DOCTOR_ID,
        name: null,
        specialty: 'Cardiology',
        address: '1 Rue Test',
        imageUrl: null,
      },
    };

    it('returns appointment for the owner', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(fakeDetail);

      const result = await service.getAppointmentDetail(PATIENT_ID, APPT_ID, false);

      expect(result).toEqual(fakeDetail);
      expect(mockAppointmentsRepo.getByIdWithDoctor).toHaveBeenCalledWith(APPT_ID);
    });

    it('returns appointment for an admin (not owner)', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(fakeDetail);

      const result = await service.getAppointmentDetail('other-user-id', APPT_ID, true);

      expect(result).toEqual(fakeDetail);
    });

    it('throws NOT_FOUND when appointment does not exist', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(null as any);

      await expect(service.getAppointmentDetail(PATIENT_ID, APPT_ID, false)).rejects.toThrow(
        expect.objectContaining({ code: 'NOT_FOUND' }),
      );
    });

    it('throws FORBIDDEN when user is not the owner and not admin', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(fakeDetail);

      await expect(service.getAppointmentDetail('other-user-id', APPT_ID, false)).rejects.toThrow(
        expect.objectContaining({ code: 'FORBIDDEN' }),
      );
    });
  });

  describe('listAllAppointments', () => {
    const fakeItems = [
      {
        id: 'appt-1',
        doctorId: DOCTOR_ID,
        patientId: PATIENT_ID,
        date: '2099-06-15',
        time: '10:00',
        status: 'PENDING' as const,
        reason: null,
        createdAt: new Date('2099-06-01'),
        doctorName: 'Dr. Smith',
        patientName: 'John Doe',
      },
    ];

    beforeEach(() => {
      mockAppointmentsRepo.listAll.mockResolvedValue(fakeItems);
      mockAppointmentsRepo.countAll.mockResolvedValue(1);
    });

    it('returns paginated results', async () => {
      const result = await service.listAllAppointments({
        page: 1,
        perPage: 10,
      });

      expect(result).toEqual({
        appointments: fakeItems,
        totalItems: 1,
        totalPages: 1,
        page: 1,
        perPage: 10,
      });
    });

    it('computes offset from page and perPage', async () => {
      await service.listAllAppointments({ page: 3, perPage: 5 });

      expect(mockAppointmentsRepo.listAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 10, limit: 5 }),
      );
    });

    it('passes filters to the repo', async () => {
      await service.listAllAppointments({
        page: 1,
        perPage: 10,
        status: 'PENDING',
        from: '2099-01-01',
        to: '2099-12-31',
        doctorId: DOCTOR_ID,
        search: 'smith',
        sort: 'dateAsc',
      });

      expect(mockAppointmentsRepo.listAll).toHaveBeenCalledWith({
        status: 'PENDING',
        from: '2099-01-01',
        to: '2099-12-31',
        doctorId: DOCTOR_ID,
        search: 'smith',
        offset: 0,
        limit: 10,
        sort: 'dateAsc',
      });
      expect(mockAppointmentsRepo.countAll).toHaveBeenCalledWith({
        status: 'PENDING',
        from: '2099-01-01',
        to: '2099-12-31',
        doctorId: DOCTOR_ID,
        search: 'smith',
      });
    });

    it('computes totalPages correctly', async () => {
      mockAppointmentsRepo.countAll.mockResolvedValue(25);

      const result = await service.listAllAppointments({ page: 1, perPage: 10 });

      expect(result.totalPages).toBe(3);
    });

    it('defaults sort to dateDesc', async () => {
      await service.listAllAppointments({ page: 1, perPage: 10 });

      expect(mockAppointmentsRepo.listAll).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'dateDesc' }),
      );
    });
  });

  describe('adminCreateAppointment', () => {
    it('creates appointment for any patient/doctor without future-date check', async () => {
      const result = await service.adminCreateAppointment({
        doctorId: DOCTOR_ID,
        patientId: PATIENT_ID,
        date: '2020-01-01',
        time: VALID_TIME,
      });

      expect(result).toEqual(fakeAppointment);
      expect(mockAppointmentsRepo.createAppointmentAtomic).toHaveBeenCalledWith({
        doctorId: DOCTOR_ID,
        patientId: PATIENT_ID,
        date: '2020-01-01',
        time: VALID_TIME,
        reason: undefined,
      });
    });

    it('throws 422 for invalid time slot', async () => {
      await expect(
        service.adminCreateAppointment({
          doctorId: DOCTOR_ID,
          patientId: PATIENT_ID,
          date: FUTURE_DATE,
          time: '10:15',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'UNPROCESSABLE_CONTENT' }));
    });

    it('throws 409 when slot is already booked', async () => {
      mockAppointmentsRepo.createAppointmentAtomic.mockResolvedValue({
        conflict: true as const,
      });

      await expect(
        service.adminCreateAppointment({
          doctorId: DOCTOR_ID,
          patientId: PATIENT_ID,
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
        service.adminCreateAppointment({
          doctorId: DOCTOR_ID,
          patientId: PATIENT_ID,
          date: FUTURE_DATE,
          time: VALID_TIME,
        }),
      ).rejects.toThrow('blocked by the doctor');
    });
  });

  describe('adminUpdateAppointment', () => {
    const fakeDetail = {
      ...fakeAppointment,
      reason: null,
      createdAt: new Date('2099-06-15T08:00:00Z'),
      updatedAt: null,
      doctor: {
        id: DOCTOR_ID,
        name: null,
        specialty: 'Cardiology',
        address: '1 Rue Test',
        imageUrl: null,
      },
    };

    it('updates appointment fields', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(fakeDetail);
      mockAppointmentsRepo.update.mockResolvedValue({
        ...fakeAppointment,
        reason: 'Updated',
        time: '14:00',
      });

      const result = await service.adminUpdateAppointment(fakeAppointment.id, {
        time: '14:00',
        reason: 'Updated',
      });

      expect(result.time).toBe('14:00');
      expect(result.reason).toBe('Updated');
    });

    it('throws NOT_FOUND when appointment does not exist', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(null as any);

      await expect(
        service.adminUpdateAppointment('non-existent', { reason: 'test' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
    });

    it('throws 422 for invalid time slot', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(fakeDetail);

      await expect(
        service.adminUpdateAppointment(fakeAppointment.id, { time: '10:15' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'UNPROCESSABLE_CONTENT' }));
    });

    it('throws INTERNAL_SERVER_ERROR when update returns null', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(fakeDetail);
      mockAppointmentsRepo.update.mockResolvedValue(null as any);

      await expect(
        service.adminUpdateAppointment(fakeAppointment.id, { reason: 'test' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }));
    });
  });

  describe('adminDeleteAppointment', () => {
    const fakeDetail = {
      ...fakeAppointment,
      reason: null,
      createdAt: new Date('2099-06-15T08:00:00Z'),
      updatedAt: null,
      doctor: {
        id: DOCTOR_ID,
        name: null,
        specialty: 'Cardiology',
        address: '1 Rue Test',
        imageUrl: null,
      },
    };

    it('deletes appointment successfully', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(fakeDetail);
      mockAppointmentsRepo.deleteById.mockResolvedValue(fakeAppointment);

      const result = await service.adminDeleteAppointment(fakeAppointment.id);

      expect(result).toEqual(fakeAppointment);
      expect(mockAppointmentsRepo.deleteById).toHaveBeenCalledWith(fakeAppointment.id);
    });

    it('throws NOT_FOUND when appointment does not exist', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(null as any);

      await expect(service.adminDeleteAppointment('non-existent')).rejects.toThrow(
        expect.objectContaining({ code: 'NOT_FOUND' }),
      );
    });

    it('throws INTERNAL_SERVER_ERROR when delete returns null', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(fakeDetail);
      mockAppointmentsRepo.deleteById.mockResolvedValue(null as any);

      await expect(service.adminDeleteAppointment(fakeAppointment.id)).rejects.toThrow(
        expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }),
      );
    });
  });

  describe('updateAppointmentStatus', () => {
    const fakeDetail = {
      ...fakeAppointment,
      reason: null,
      createdAt: new Date('2099-06-15T08:00:00Z'),
      updatedAt: null,
      doctor: {
        id: DOCTOR_ID,
        name: null,
        specialty: 'Cardiology',
        address: '1 Rue Test',
        imageUrl: null,
      },
    };

    const fakeUpdated = {
      id: fakeAppointment.id,
      doctorId: DOCTOR_ID,
      patientId: PATIENT_ID,
      date: FUTURE_DATE,
      time: VALID_TIME,
      status: 'CONFIRMED' as const,
    };

    it('transitions PENDING to CONFIRMED', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue({
        ...fakeDetail,
        status: 'PENDING',
      });
      mockAppointmentsRepo.updateStatus.mockResolvedValue(fakeUpdated);

      const result = await service.updateAppointmentStatus(fakeAppointment.id, 'CONFIRMED');

      expect(result).toEqual(fakeUpdated);
      expect(mockAppointmentsRepo.updateStatus).toHaveBeenCalledWith(
        fakeAppointment.id,
        'CONFIRMED',
      );
    });

    it('transitions PENDING to CANCELLED', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue({
        ...fakeDetail,
        status: 'PENDING',
      });
      mockAppointmentsRepo.updateStatus.mockResolvedValue({ ...fakeUpdated, status: 'CANCELLED' });

      const result = await service.updateAppointmentStatus(fakeAppointment.id, 'CANCELLED');

      expect(result.status).toBe('CANCELLED');
    });

    it('transitions CONFIRMED to COMPLETED', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue({
        ...fakeDetail,
        status: 'CONFIRMED',
      });
      mockAppointmentsRepo.updateStatus.mockResolvedValue({ ...fakeUpdated, status: 'COMPLETED' });

      const result = await service.updateAppointmentStatus(fakeAppointment.id, 'COMPLETED');

      expect(result.status).toBe('COMPLETED');
    });

    it('throws NOT_FOUND when appointment does not exist', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue(null as any);

      await expect(service.updateAppointmentStatus('non-existent', 'CONFIRMED')).rejects.toThrow(
        expect.objectContaining({ code: 'NOT_FOUND' }),
      );
    });

    it('throws BAD_REQUEST for invalid transition COMPLETED -> CONFIRMED', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue({
        ...fakeDetail,
        status: 'COMPLETED',
      });

      await expect(
        service.updateAppointmentStatus(fakeAppointment.id, 'CONFIRMED'),
      ).rejects.toThrow(expect.objectContaining({ code: 'BAD_REQUEST' }));
    });

    it('throws BAD_REQUEST for invalid transition CANCELLED -> CONFIRMED', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue({
        ...fakeDetail,
        status: 'CANCELLED',
      });

      await expect(
        service.updateAppointmentStatus(fakeAppointment.id, 'CONFIRMED'),
      ).rejects.toThrow(expect.objectContaining({ code: 'BAD_REQUEST' }));
    });

    it('throws INTERNAL_SERVER_ERROR when updateStatus returns null', async () => {
      mockAppointmentsRepo.getByIdWithDoctor.mockResolvedValue({
        ...fakeDetail,
        status: 'PENDING',
      });
      mockAppointmentsRepo.updateStatus.mockResolvedValue(null as any);

      await expect(
        service.updateAppointmentStatus(fakeAppointment.id, 'CONFIRMED'),
      ).rejects.toThrow(expect.objectContaining({ code: 'INTERNAL_SERVER_ERROR' }));
    });
  });

  describe('listMyAppointments', () => {
    const fakeItems = [
      {
        ...fakeAppointment,
        reason: null,
        doctor: {
          id: DOCTOR_ID,
          name: null,
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
