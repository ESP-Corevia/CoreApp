import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller } from '../../test/caller';
import { mockServices } from '../../test/services';

beforeEach(() => {});

const fakeDoctors = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Dr. Alice Martin',
    specialty: 'Cardiology',
    address: '10 Rue de Paris',
    city: 'Paris',
    imageUrl: null,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Dr. Bob Dupont',
    specialty: 'Dermatology',
    address: '5 Avenue des Champs',
    city: 'Lyon',
    imageUrl: 'https://example.com/bob.jpg',
  },
];

describe('doctorsRouter', () => {
  describe('list', () => {
    it('returns paginated doctors with default params', async () => {
      mockServices.doctorsService.listBookable.mockResolvedValue({
        items: fakeDoctors,
        page: 1,
        limit: 20,
        total: 2,
      });

      const caller = createTestCaller({ customSession: null });
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

      const caller = createTestCaller({ customSession: null });
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

      const caller = createTestCaller({ customSession: null });
      const result = await caller.doctors.list({ specialty: 'Unknown' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('rejects invalid page number', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.doctors.list({ page: 0 })).rejects.toThrow();
    });

    it('rejects limit over 100', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.doctors.list({ limit: 101 })).rejects.toThrow();
    });
  });
});
