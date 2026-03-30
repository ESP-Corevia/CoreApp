/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRepositories } from '../../../test/repositories';

import { createPatientsService } from './patients.service';

const patientsService = createPatientsService(
  mockRepositories.patientsRepo,
  mockRepositories.usersRepo,
);

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

const patientData = {
  dateOfBirth: '1990-05-20',
  gender: 'MALE' as const,
  phone: null,
  address: null,
  bloodType: null,
  allergies: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
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
  it('delegates to repo.upsert and returns result', async () => {
    mockRepositories.patientsRepo.upsert.mockResolvedValue(fakeProfile);

    const result = await patientsService.upsert('user-1', patientData);

    expect(result).toEqual(fakeProfile);
    expect(mockRepositories.patientsRepo.upsert).toHaveBeenCalledWith('user-1', patientData);
  });

  it('returns updated fields from repo', async () => {
    const updated = { ...fakeProfile, phone: '+33612345678', gender: 'FEMALE' as const };
    mockRepositories.patientsRepo.upsert.mockResolvedValue(updated);

    const result = await patientsService.upsert('user-1', {
      ...patientData,
      phone: '+33612345678',
      gender: 'FEMALE' as const,
    });

    expect(result.gender).toBe('FEMALE');
    expect(result.phone).toBe('+33612345678');
  });
});

describe('createProfile', () => {
  it('creates a patient profile for a user with role patient', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue({ id: 'user-1', role: 'patient' } as any);
    mockRepositories.patientsRepo.findByUserId.mockResolvedValue(null);
    mockRepositories.patientsRepo.createByUserId.mockResolvedValue(fakeProfile as any);

    const result = await patientsService.createProfile('user-1', patientData);

    expect(mockRepositories.usersRepo.findById).toHaveBeenCalledWith({ id: 'user-1' });
    expect(mockRepositories.patientsRepo.createByUserId).toHaveBeenCalledWith(
      'user-1',
      patientData,
    );
    expect(result).toEqual(fakeProfile);
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue(undefined as any);

    await expect(patientsService.createProfile('no-user', patientData)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws BAD_REQUEST when user role is not patient', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue({ id: 'user-1', role: 'doctor' } as any);

    await expect(patientsService.createProfile('user-1', patientData)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('throws BAD_REQUEST with "none" when user role is null', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue({ id: 'user-1', role: null } as any);

    await expect(patientsService.createProfile('user-1', patientData)).rejects.toThrow(
      'User role is "none", expected "patient"',
    );
  });

  it('throws CONFLICT when patient profile already exists', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue({ id: 'user-1', role: 'patient' } as any);
    mockRepositories.patientsRepo.findByUserId.mockResolvedValue(fakeProfile as any);

    await expect(patientsService.createProfile('user-1', patientData)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
});

describe('updateProfile', () => {
  it('updates and returns the patient profile', async () => {
    const updated = { ...fakeProfile, phone: '+33612345678' };
    mockRepositories.patientsRepo.findByUserId.mockResolvedValue(fakeProfile as any);
    mockRepositories.patientsRepo.updateByUserId.mockResolvedValue(updated);

    const result = await patientsService.updateProfile('user-1', { phone: '+33612345678' });

    expect(mockRepositories.patientsRepo.updateByUserId).toHaveBeenCalledWith('user-1', {
      phone: '+33612345678',
    });
    expect(result).toEqual(updated);
  });

  it('throws NOT_FOUND when the patient profile does not exist', async () => {
    mockRepositories.patientsRepo.findByUserId.mockResolvedValue(null);

    await expect(
      patientsService.updateProfile('no-user', { phone: '+33612345678' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Patient profile not found' });
  });
});

describe('deleteProfile', () => {
  it('deletes the patient profile', async () => {
    mockRepositories.patientsRepo.findByUserId.mockResolvedValue(fakeProfile as any);
    mockRepositories.patientsRepo.deleteByUserId.mockResolvedValue({ id: 'pat-1' });

    const result = await patientsService.deleteProfile('user-1');

    expect(mockRepositories.patientsRepo.deleteByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ id: 'pat-1' });
  });

  it('throws NOT_FOUND when patient profile does not exist', async () => {
    mockRepositories.patientsRepo.findByUserId.mockResolvedValue(null);

    await expect(patientsService.deleteProfile('no-user')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('listAllAdmin', () => {
  const fakeAdminPatient = {
    userId: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    patientId: 'pat-1',
    dateOfBirth: '1990-05-20',
    gender: 'MALE',
  };

  beforeEach(() => {
    mockRepositories.patientsRepo.listAllAdmin.mockResolvedValue([fakeAdminPatient] as any);
    mockRepositories.patientsRepo.countAllAdmin.mockResolvedValue(1);
  });

  it('computes offset and delegates to repo', async () => {
    const result = await patientsService.listAllAdmin({ page: 2, perPage: 10, search: 'john' });

    expect(mockRepositories.patientsRepo.listAllAdmin).toHaveBeenCalledWith({
      search: 'john',
      gender: undefined,
      offset: 10,
      limit: 10,
    });
    expect(mockRepositories.patientsRepo.countAllAdmin).toHaveBeenCalledWith({
      search: 'john',
      gender: undefined,
    });
    expect(result).toEqual({
      patients: [fakeAdminPatient],
      totalItems: 1,
      totalPages: 1,
      page: 2,
      perPage: 10,
    });
  });

  it('passes gender filter to repo', async () => {
    await patientsService.listAllAdmin({ page: 1, perPage: 10, gender: 'FEMALE' });

    expect(mockRepositories.patientsRepo.listAllAdmin).toHaveBeenCalledWith({
      search: undefined,
      gender: 'FEMALE',
      offset: 0,
      limit: 10,
    });
  });

  it('computes totalPages correctly', async () => {
    mockRepositories.patientsRepo.countAllAdmin.mockResolvedValue(25);

    const result = await patientsService.listAllAdmin({ page: 1, perPage: 10 });

    expect(result.totalPages).toBe(3);
  });

  it('returns empty results with total 0', async () => {
    mockRepositories.patientsRepo.listAllAdmin.mockResolvedValue([]);
    mockRepositories.patientsRepo.countAllAdmin.mockResolvedValue(0);

    const result = await patientsService.listAllAdmin({ page: 1, perPage: 10 });

    expect(result).toEqual({
      patients: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      perPage: 10,
    });
  });
});

describe('service creation', () => {
  it('can be created with required dependencies', () => {
    const service = createPatientsService(
      mockRepositories.patientsRepo,
      mockRepositories.usersRepo,
    );
    expect(service).toBeDefined();
    expect(typeof service.getByUserId).toBe('function');
    expect(typeof service.upsert).toBe('function');
    expect(typeof service.createProfile).toBe('function');
    expect(typeof service.updateProfile).toBe('function');
    expect(typeof service.deleteProfile).toBe('function');
    expect(typeof service.listAllAdmin).toBe('function');
  });
});
