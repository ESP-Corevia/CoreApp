import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, fakeDoctorSession, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

beforeEach(() => {
  mockServices.medicationsService.search.mockReset();
  mockServices.medicationsService.getByCode.mockReset();
});

// ─── Authentication ─────────────────────────────────────────

describe('medications router - auth', () => {
  it('rejects unauthenticated search', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.medications.search({ query: 'test', page: 1, limit: 20 })).rejects.toThrow(
      'Authentication required',
    );
  });

  it('rejects doctor role for search', async () => {
    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await expect(caller.medications.search({ query: 'test', page: 1, limit: 20 })).rejects.toThrow(
      'Patient access required',
    );
  });

  it('allows patient to search', async () => {
    mockServices.medicationsService.search.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.medications.search({ query: 'test', page: 1, limit: 20 });

    expect(result.items).toEqual([]);
  });
});

// ─── Medications Search ─────────────────────────────────────

describe('medications.search', () => {
  it('validates minimum query length', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.medications.search({ query: 'ab', page: 1, limit: 20 })).rejects.toThrow();
  });

  it('passes params to service', async () => {
    mockServices.medicationsService.search.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      limit: 10,
    });

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.medications.search({ query: 'doliprane', page: 2, limit: 10 });

    expect(mockServices.medicationsService.search).toHaveBeenCalledWith({
      query: 'doliprane',
      page: 2,
      limit: 10,
    });
  });
});

// ─── Medications - getByCode ────────────────────────────────

describe('medications.getByCode', () => {
  it('passes params to service', async () => {
    mockServices.medicationsService.getByCode.mockResolvedValue(null);

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.medications.getByCode({ cis: '60234100' });

    expect(mockServices.medicationsService.getByCode).toHaveBeenCalledWith({ cis: '60234100' });
    expect(result).toBeNull();
  });
});
