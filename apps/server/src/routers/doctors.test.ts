import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, fakeDoctorSession, fakeSession } from '../../test/caller';
import { mockServices } from '../../test/services';

beforeEach(() => {
  mockServices.doctorsService.listBookable.mockReset();
  mockServices.availabilityService.getAvailableSlots.mockReset();
});

const fakeDoctors = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    userId: null,
    name: 'Dr. Alice Martin',
    specialty: 'Cardiology',
    address: '10 Rue de Paris',
    city: 'Paris',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    userId: 'u_1',
    name: 'Dr. Bob Dupont',
    specialty: 'Dermatology',
    address: '5 Avenue des Champs',
    city: 'Lyon',
  },
];

describe('doctorsRouter', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.doctors.list({})).rejects.toThrow('Authentication required');
  });

  it('rejects non-patient roles', async () => {
    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await expect(caller.doctors.list({})).rejects.toThrow('Patient access required');
  });

  describe('list', () => {
    it('returns paginated doctors with default params', async () => {
      mockServices.doctorsService.listBookable.mockResolvedValue({
        items: fakeDoctors,
        page: 1,
        limit: 20,
        total: 2,
      });

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.doctors.list({});

      expect(result).toEqual({
        items: fakeDoctors,
        page: 1,
        limit: 20,
        total: 2,
      });
      expect(mockServices.doctorsService.listBookable).toHaveBeenCalledWith({
        specialty: undefined,
        city: undefined,
        search: undefined,
        page: 1,
        limit: 20,
      });
    });

    it('passes filters to the service', async () => {
      mockServices.doctorsService.listBookable.mockResolvedValue({
        items: [fakeDoctors[0]],
        page: 1,
        limit: 10,
        total: 1,
      });

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.doctors.list({
        specialty: 'Cardiology',
        city: 'Paris',
        search: 'Alice',
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockServices.doctorsService.listBookable).toHaveBeenCalledWith({
        specialty: 'Cardiology',
        city: 'Paris',
        search: 'Alice',
        page: 1,
        limit: 10,
      });
    });

    it('returns empty list when no doctors match', async () => {
      mockServices.doctorsService.listBookable.mockResolvedValue({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
      });

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.doctors.list({ specialty: 'Unknown' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('rejects invalid page number', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.doctors.list({ page: 0 })).rejects.toThrow();
    });

    it('rejects limit over 100', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(caller.doctors.list({ limit: 101 })).rejects.toThrow();
    });
  });

  describe('availableSlots', () => {
    const DOCTOR_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const DATE = '2099-06-15';

    it('returns available slots from the service', async () => {
      const expected = { doctorId: DOCTOR_ID, date: DATE, slots: ['08:00', '08:30'] };
      mockServices.availabilityService.getAvailableSlots.mockResolvedValue(expected);

      const caller = createTestCaller({ customSession: fakeSession });
      const result = await caller.doctors.availableSlots({ doctorId: DOCTOR_ID, date: DATE });

      expect(result).toEqual(expected);
      expect(mockServices.availabilityService.getAvailableSlots).toHaveBeenCalledWith(
        DOCTOR_ID,
        DATE,
      );
    });

    it('rejects invalid doctorId (not uuid)', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.doctors.availableSlots({ doctorId: 'not-a-uuid', date: DATE }),
      ).rejects.toThrow();
    });

    it('rejects invalid date format', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.doctors.availableSlots({ doctorId: DOCTOR_ID, date: '15-06-2099' }),
      ).rejects.toThrow();
    });

    it('propagates NOT_FOUND from the service', async () => {
      mockServices.availabilityService.getAvailableSlots.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Doctor not found' }),
      );

      const caller = createTestCaller({ customSession: fakeSession });
      await expect(
        caller.doctors.availableSlots({ doctorId: DOCTOR_ID, date: DATE }),
      ).rejects.toThrow('Doctor not found');
    });
  });
});
