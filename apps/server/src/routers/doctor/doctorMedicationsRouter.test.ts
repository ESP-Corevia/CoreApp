import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, fakeDoctorSession, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

beforeEach(() => {
  mockServices.medicationsService.search.mockReset();
  mockServices.medicationsService.getByCode.mockReset();
});

describe('doctor.medications', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(
      caller.doctor.medications.search({ query: 'test', page: 1, limit: 20 }),
    ).rejects.toThrow('Authentication required');
  });

  it('rejects patient role', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(
      caller.doctor.medications.search({ query: 'test', page: 1, limit: 20 }),
    ).rejects.toThrow('Doctor access required');
  });

  describe('search', () => {
    it('returns search results for doctor', async () => {
      mockServices.medicationsService.search.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.medications.search({
        query: 'doliprane',
        page: 1,
        limit: 20,
      });

      expect(result.items).toEqual([]);
      expect(mockServices.medicationsService.search).toHaveBeenCalledWith({
        query: 'doliprane',
        page: 1,
        limit: 20,
      });
    });

    it('validates minimum query length', async () => {
      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(
        caller.doctor.medications.search({ query: 'ab', page: 1, limit: 20 }),
      ).rejects.toThrow();
    });
  });

  describe('getByCode', () => {
    it('passes params to service', async () => {
      mockServices.medicationsService.getByCode.mockResolvedValue(null);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.medications.getByCode({ cis: '60234100' });

      expect(mockServices.medicationsService.getByCode).toHaveBeenCalledWith({ cis: '60234100' });
      expect(result).toBeNull();
    });
  });
});
