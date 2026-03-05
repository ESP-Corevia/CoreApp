import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, fakeSession } from '../../test/caller';
import { mockServices } from '../../test/services';

beforeEach(() => {
  mockServices.appointmentsService.createAppointment.mockReset();
});

const DOCTOR_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const DATE = '2099-06-15';
const TIME = '10:00';

const fakeAppointment = {
  id: 'appt-uuid-1',
  doctorId: DOCTOR_ID,
  patientId: 'u_1',
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
});
