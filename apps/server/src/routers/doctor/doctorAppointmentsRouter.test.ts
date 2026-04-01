/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createTestCaller,
  fakeAdminSession,
  fakeDoctorSession,
  fakeSession,
} from '../../../test/caller';
import { mockServices } from '../../../test/services';

beforeEach(() => {
  mockServices.appointmentsService.listDoctorAppointments.mockReset();
  mockServices.appointmentsService.getDoctorAppointmentDetail.mockReset();
  mockServices.appointmentsService.updateDoctorAppointmentStatus.mockReset();
});

const DOCTOR_USER_ID = fakeDoctorSession.userId;
const DOCTOR_UUID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';
const PATIENT_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const APPT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const DATE = '2099-06-15';
const TIME = '10:00';

const fakeAppointment = {
  id: APPT_ID,
  doctorId: DOCTOR_UUID,
  patientId: PATIENT_ID,
  date: DATE,
  time: TIME,
  status: 'PENDING' as const,
};

const fakeListResult = {
  items: [
    {
      ...fakeAppointment,
      reason: null,
      createdAt: new Date('2099-06-15T08:00:00Z'),
      patient: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0612345678',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
      },
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
};

const fakeDetail = {
  ...fakeAppointment,
  reason: null,
  createdAt: new Date('2099-06-15T08:00:00Z'),
  updatedAt: null,
  doctor: {
    id: DOCTOR_UUID,
    name: 'Dr. Test',
    specialty: 'Cardiology',
    address: '1 Rue Test',
  },
};

describe('doctor.appointments', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.doctor.appointments.listMine({})).rejects.toThrow(
      'Authentication required',
    );
  });

  it('rejects patient role', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.doctor.appointments.listMine({})).rejects.toThrow('Doctor access required');
  });

  it('allows admin role', async () => {
    mockServices.appointmentsService.listDoctorAppointments.mockResolvedValue({
      ...fakeListResult,
      items: [],
      total: 0,
    });

    const caller = createTestCaller({ customSession: fakeAdminSession });
    const result = await caller.doctor.appointments.listMine({});

    expect(result.items).toEqual([]);
  });

  describe('listMine', () => {
    it('returns paginated appointments with patient info', async () => {
      mockServices.appointmentsService.listDoctorAppointments.mockResolvedValue(fakeListResult);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.appointments.listMine({});

      expect(result).toEqual(fakeListResult);
      expect(mockServices.appointmentsService.listDoctorAppointments).toHaveBeenCalledWith(
        DOCTOR_USER_ID,
        expect.objectContaining({ page: 1, limit: 20, sort: 'dateDesc' }),
      );
    });

    it('passes filters to the service', async () => {
      mockServices.appointmentsService.listDoctorAppointments.mockResolvedValue({
        ...fakeListResult,
        items: [],
        total: 0,
      });

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await caller.doctor.appointments.listMine({
        status: 'PENDING',
        from: '2099-01-01',
        to: '2099-12-31',
        page: 2,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(mockServices.appointmentsService.listDoctorAppointments).toHaveBeenCalledWith(
        DOCTOR_USER_ID,
        {
          status: 'PENDING',
          from: '2099-01-01',
          to: '2099-12-31',
          page: 2,
          limit: 10,
          sort: 'dateAsc',
        },
      );
    });

    it('rejects invalid status', async () => {
      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(
        caller.doctor.appointments.listMine({ status: 'INVALID' as any }),
      ).rejects.toThrow();
    });
  });

  describe('detail', () => {
    it('returns appointment detail for the doctor', async () => {
      mockServices.appointmentsService.getDoctorAppointmentDetail.mockResolvedValue(fakeDetail);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.appointments.detail({ id: APPT_ID });

      expect(result).toEqual(fakeDetail);
      expect(mockServices.appointmentsService.getDoctorAppointmentDetail).toHaveBeenCalledWith(
        DOCTOR_USER_ID,
        APPT_ID,
      );
    });

    it('rejects invalid UUID for id', async () => {
      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.doctor.appointments.detail({ id: 'bad-id' })).rejects.toThrow();
    });

    it('propagates NOT_FOUND from the service', async () => {
      mockServices.appointmentsService.getDoctorAppointmentDetail.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' }),
      );

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.doctor.appointments.detail({ id: APPT_ID })).rejects.toThrow('not found');
    });

    it('propagates FORBIDDEN from the service', async () => {
      mockServices.appointmentsService.getDoctorAppointmentDetail.mockRejectedValue(
        new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access' }),
      );

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.doctor.appointments.detail({ id: APPT_ID })).rejects.toThrow(
        'do not have access',
      );
    });
  });

  describe('updateStatus', () => {
    it('confirms an appointment', async () => {
      mockServices.appointmentsService.updateDoctorAppointmentStatus.mockResolvedValue({
        ...fakeAppointment,
        status: 'CONFIRMED',
      });

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.appointments.updateStatus({
        id: APPT_ID,
        status: 'CONFIRMED',
      });

      expect(result.status).toBe('CONFIRMED');
      expect(mockServices.appointmentsService.updateDoctorAppointmentStatus).toHaveBeenCalledWith(
        DOCTOR_USER_ID,
        APPT_ID,
        'CONFIRMED',
      );
    });

    it('completes an appointment', async () => {
      mockServices.appointmentsService.updateDoctorAppointmentStatus.mockResolvedValue({
        ...fakeAppointment,
        status: 'COMPLETED',
      });

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.appointments.updateStatus({
        id: APPT_ID,
        status: 'COMPLETED',
      });

      expect(result.status).toBe('COMPLETED');
    });

    it('cancels an appointment', async () => {
      mockServices.appointmentsService.updateDoctorAppointmentStatus.mockResolvedValue({
        ...fakeAppointment,
        status: 'CANCELLED',
      });

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.appointments.updateStatus({
        id: APPT_ID,
        status: 'CANCELLED',
      });

      expect(result.status).toBe('CANCELLED');
    });

    it('rejects invalid status value', async () => {
      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(
        caller.doctor.appointments.updateStatus({ id: APPT_ID, status: 'PENDING' as any }),
      ).rejects.toThrow();
    });

    it('propagates FORBIDDEN from the service', async () => {
      mockServices.appointmentsService.updateDoctorAppointmentStatus.mockRejectedValue(
        new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access' }),
      );

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(
        caller.doctor.appointments.updateStatus({ id: APPT_ID, status: 'CONFIRMED' }),
      ).rejects.toThrow('do not have access');
    });

    it('propagates BAD_REQUEST for invalid transition', async () => {
      mockServices.appointmentsService.updateDoctorAppointmentStatus.mockRejectedValue(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot transition from COMPLETED to CONFIRMED',
        }),
      );

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(
        caller.doctor.appointments.updateStatus({ id: APPT_ID, status: 'CONFIRMED' }),
      ).rejects.toThrow('Cannot transition');
    });
  });
});
