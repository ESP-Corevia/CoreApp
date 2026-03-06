import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createTestCaller,
  fakeAdminSession,
  fakeDoctorSession,
  fakeSession,
} from '../../test/caller';
import { mockServices } from '../../test/services';

beforeEach(() => {
  mockServices.appointmentsService.createAppointment.mockReset();
  mockServices.appointmentsService.listMyAppointments.mockReset();
  mockServices.appointmentsService.getAppointmentDetail.mockReset();
});

const DOCTOR_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const DATE = '2099-06-15';
const TIME = '10:00';

const fakeAppointment = {
  id: 'appt-uuid-1',
  doctorId: DOCTOR_ID,
  patientId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  date: DATE,
  time: TIME,
  status: 'PENDING' as const,
};

describe('appointmentsRouter', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(
      caller.appointments.create({ doctorId: DOCTOR_ID, date: DATE, time: TIME }),
    ).rejects.toThrow('Authentication required');
  });

  it('rejects non-patient roles', async () => {
    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await expect(
      caller.appointments.create({ doctorId: DOCTOR_ID, date: DATE, time: TIME }),
    ).rejects.toThrow('Patient access required');
  });

  describe('detail', () => {
    const APPT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    const fakeDetail = {
      ...fakeAppointment,
      id: APPT_ID,
      reason: null,
      createdAt: new Date('2099-06-15T08:00:00Z'),
      updatedAt: null,
      doctor: {
        id: DOCTOR_ID,
        name: 'Dr. Test',
        specialty: 'Cardiology',
        address: '1 Rue Test',
      },
    };

    it('returns appointment detail for the owner', async () => {
      mockServices.appointmentsService.getAppointmentDetail.mockResolvedValue(fakeDetail);

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.appointments.detail({ id: APPT_ID });

      expect(result).toEqual(fakeDetail);
      expect(mockServices.appointmentsService.getAppointmentDetail).toHaveBeenCalledWith(
        fakeSession.userId,
        APPT_ID,
        false,
      );
    });

    it('rejects invalid UUID for id', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.appointments.detail({ id: 'bad-id' })).rejects.toThrow();
    });

    it('rejects unauthenticated requests', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.appointments.detail({ id: APPT_ID })).rejects.toThrow(
        'Authentication required',
      );
    });

    it('propagates NOT_FOUND from the service', async () => {
      mockServices.appointmentsService.getAppointmentDetail.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.appointments.detail({ id: APPT_ID })).rejects.toThrow('not found');
    });

    it('propagates FORBIDDEN from the service', async () => {
      mockServices.appointmentsService.getAppointmentDetail.mockRejectedValue(
        new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.appointments.detail({ id: APPT_ID })).rejects.toThrow(
        'do not have access',
      );
    });

    it('passes isAdmin=true when session role is admin', async () => {
      mockServices.appointmentsService.getAppointmentDetail.mockResolvedValue(fakeDetail);

      const caller = createTestCaller({ customSession: fakeAdminSession });
      await caller.appointments.detail({ id: APPT_ID });

      expect(mockServices.appointmentsService.getAppointmentDetail).toHaveBeenCalledWith(
        fakeAdminSession.userId,
        APPT_ID,
        true,
      );
    });

    it('rejects doctor role', async () => {
      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.appointments.detail({ id: APPT_ID })).rejects.toThrow(
        'Patient access required',
      );
    });
  });

  describe('create', () => {
    it('creates an appointment and returns it', async () => {
      mockServices.appointmentsService.createAppointment.mockResolvedValue(fakeAppointment);

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.appointments.create({
        doctorId: DOCTOR_ID,
        date: DATE,
        time: TIME,
        reason: 'Checkup',
      });

      expect(result).toEqual(fakeAppointment);
      expect(mockServices.appointmentsService.createAppointment).toHaveBeenCalledWith(
        fakeSession.userId,
        { doctorId: DOCTOR_ID, date: DATE, time: TIME, reason: 'Checkup' },
      );
    });

    it('rejects invalid doctorId', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.appointments.create({ doctorId: 'bad', date: DATE, time: TIME }),
      ).rejects.toThrow();
    });

    it('rejects invalid date format', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.appointments.create({ doctorId: DOCTOR_ID, date: '15-06-2099', time: TIME }),
      ).rejects.toThrow();
    });

    it('rejects invalid time format', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.appointments.create({ doctorId: DOCTOR_ID, date: DATE, time: '10h00' }),
      ).rejects.toThrow();
    });

    it('propagates CONFLICT from the service', async () => {
      mockServices.appointmentsService.createAppointment.mockRejectedValue(
        new TRPCError({ code: 'CONFLICT', message: 'This time slot is already booked' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.appointments.create({ doctorId: DOCTOR_ID, date: DATE, time: TIME }),
      ).rejects.toThrow('already booked');
    });

    it('propagates UNPROCESSABLE_CONTENT from the service', async () => {
      mockServices.appointmentsService.createAppointment.mockRejectedValue(
        new TRPCError({
          code: 'UNPROCESSABLE_CONTENT',
          message: 'Cannot book an appointment in the past',
        }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.appointments.create({ doctorId: DOCTOR_ID, date: DATE, time: TIME }),
      ).rejects.toThrow('in the past');
    });
  });

  describe('listMine', () => {
    const fakeListResult = {
      items: [
        {
          ...fakeAppointment,
          reason: null,
          doctor: {
            id: DOCTOR_ID,
            name: 'Dr. Test',
            specialty: 'Cardiology',
            address: '1 Rue Test',
          },
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    };

    it('returns paginated appointments', async () => {
      mockServices.appointmentsService.listMyAppointments.mockResolvedValue(fakeListResult);

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.appointments.listMine({});

      expect(result).toEqual(fakeListResult);
      expect(mockServices.appointmentsService.listMyAppointments).toHaveBeenCalledWith(
        fakeSession.userId,
        expect.objectContaining({ page: 1, limit: 20, sort: 'dateDesc' }),
      );
    });

    it('passes filters to the service', async () => {
      mockServices.appointmentsService.listMyAppointments.mockResolvedValue({
        ...fakeListResult,
        items: [],
        total: 0,
      });

      const caller = createTestCaller({ customSession: fakeSession });
      await caller.appointments.listMine({
        status: 'PENDING',
        from: '2099-01-01',
        to: '2099-12-31',
        page: 2,
        limit: 10,
        sort: 'dateAsc',
      });

      expect(mockServices.appointmentsService.listMyAppointments).toHaveBeenCalledWith(
        fakeSession.userId,
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
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.appointments.listMine({ status: 'INVALID' as any })).rejects.toThrow();
    });

    it('rejects unauthenticated requests', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.appointments.listMine({})).rejects.toThrow('Authentication required');
    });

    it('propagates BAD_REQUEST from the service', async () => {
      mockServices.appointmentsService.listMyAppointments.mockRejectedValue(
        new TRPCError({ code: 'BAD_REQUEST', message: '"from" must be before or equal to "to"' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.appointments.listMine({})).rejects.toThrow('before or equal');
    });
  });
});
