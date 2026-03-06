import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRepositories } from '../../../test/repositories';

import { createPatientsService } from './patients.service';

const patientsService = createPatientsService(mockRepositories.patientsRepo);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

const fakeProfile = {
  id: 'pat-1',
  userId: 'user-1',
  dateOfBirth: '1990-05-20',
  gender: 'MALE' as const,
  phone: null,
  address: null,
  bloodType: null,
  allergies: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  createdAt: new Date(),
  updatedAt: null,
};

describe('getByUserId', () => {
  it('returns the patient profile for the given userId', async () => {
    mockRepositories.patientsRepo.findByUserId.mockResolvedValue(fakeProfile);

    const result = await patientsService.getByUserId('user-1');

    expect(result).toEqual(fakeProfile);
    expect(mockRepositories.patientsRepo.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns null when no profile exists', async () => {
    mockRepositories.patientsRepo.findByUserId.mockResolvedValue(null);

    const result = await patientsService.getByUserId('unknown');

    expect(result).toBeNull();
  });
});

describe('upsert', () => {
  const data = {
    dateOfBirth: '1990-05-20',
    gender: 'MALE' as const,
    phone: null,
    address: null,
    bloodType: null,
    allergies: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
  };

  it('delegates to repo.upsert and returns result', async () => {
    mockRepositories.patientsRepo.upsert.mockResolvedValue(fakeProfile);

    const result = await patientsService.upsert('user-1', data);

    expect(result).toEqual(fakeProfile);
    expect(mockRepositories.patientsRepo.upsert).toHaveBeenCalledWith('user-1', data);
  });

  it('returns updated fields from repo', async () => {
    const updated = { ...fakeProfile, phone: '+33612345678', gender: 'FEMALE' as const };
    mockRepositories.patientsRepo.upsert.mockResolvedValue(updated);

    const result = await patientsService.upsert('user-1', {
      ...data,
      phone: '+33612345678',
      gender: 'FEMALE' as const,
    });

    expect(result.gender).toBe('FEMALE');
    expect(result.phone).toBe('+33612345678');
  });
});

describe('service creation', () => {
  it('can be created with required dependencies', () => {
    const service = createPatientsService(mockRepositories.patientsRepo);
    expect(service).toBeDefined();
    expect(typeof service.getByUserId).toBe('function');
    expect(typeof service.upsert).toBe('function');
  });
});
