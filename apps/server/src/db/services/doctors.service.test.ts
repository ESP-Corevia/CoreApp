/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
/* eslint-disable require-await */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRepositories } from '../../../test/repositories';

import { createDoctorsService } from './doctors.service';

const doctorsService = createDoctorsService(
  mockRepositories.doctorsRepo,
  mockRepositories.usersRepo,
);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

const fakeDoctor = {
  id: 'doc-1',
  userId: 'user-1',
  specialty: 'Cardiology',
  address: '10 Rue de Rivoli, Paris',
  city: 'Paris',
  imageUrl: null,
  name: 'Dr. John Doe',
};

describe('listBookable', () => {
  it('computes offset and delegates to repo', async () => {
    mockRepositories.doctorsRepo.listBookable.mockResolvedValue([fakeDoctor]);
    mockRepositories.doctorsRepo.countBookable.mockResolvedValue(1);

    const result = await doctorsService.listBookable({
      page: 2,
      limit: 10,
      specialty: 'Cardiology',
    });

    expect(mockRepositories.doctorsRepo.listBookable).toHaveBeenCalledWith({
      specialty: 'Cardiology',
      offset: 10,
      limit: 10,
    });
    expect(mockRepositories.doctorsRepo.countBookable).toHaveBeenCalledWith({
      specialty: 'Cardiology',
    });
    expect(result).toEqual({ items: [fakeDoctor], page: 2, limit: 10, total: 1 });
  });

  it('passes all filters to repo', async () => {
    mockRepositories.doctorsRepo.listBookable.mockResolvedValue([]);
    mockRepositories.doctorsRepo.countBookable.mockResolvedValue(0);

    await doctorsService.listBookable({
      page: 1,
      limit: 20,
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'cardio',
    });

    expect(mockRepositories.doctorsRepo.listBookable).toHaveBeenCalledWith({
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'cardio',
      offset: 0,
      limit: 20,
    });
    expect(mockRepositories.doctorsRepo.countBookable).toHaveBeenCalledWith({
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'cardio',
    });
  });

  it('returns empty items with total 0 when no match', async () => {
    mockRepositories.doctorsRepo.listBookable.mockResolvedValue([]);
    mockRepositories.doctorsRepo.countBookable.mockResolvedValue(0);

    const result = await doctorsService.listBookable({ page: 1, limit: 20 });

    expect(result).toEqual({ items: [], page: 1, limit: 20, total: 0 });
  });

  it('runs listBookable and countBookable in parallel', async () => {
    let listResolved = false;
    let countResolved = false;

    mockRepositories.doctorsRepo.listBookable.mockImplementation(async () => {
      listResolved = true;
      expect(countResolved).toBe(false);
      return [fakeDoctor];
    });
    mockRepositories.doctorsRepo.countBookable.mockImplementation(async () => {
      countResolved = true;
      return 1;
    });

    const result = await doctorsService.listBookable({ page: 1, limit: 10 });

    expect(listResolved).toBe(true);
    expect(countResolved).toBe(true);
    expect(result.items).toHaveLength(1);
  });
});

describe('getByUserId', () => {
  it('returns the doctor profile for the given userId', async () => {
    mockRepositories.doctorsRepo.getByUserId.mockResolvedValue(fakeDoctor);

    const result = await doctorsService.getByUserId('user-1');

    expect(result).toEqual(fakeDoctor);
    expect(mockRepositories.doctorsRepo.getByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns null when no doctor found', async () => {
    mockRepositories.doctorsRepo.getByUserId.mockResolvedValue(null as any);

    const result = await doctorsService.getByUserId('unknown-user');

    expect(result).toBeNull();
  });
});

describe('updateProfile', () => {
  it('updates and returns the doctor profile', async () => {
    const updated = { ...fakeDoctor, specialty: 'Dermatology' };
    mockRepositories.doctorsRepo.getByUserId.mockResolvedValue(fakeDoctor);
    mockRepositories.doctorsRepo.updateByUserId.mockResolvedValue(updated);

    const result = await doctorsService.updateProfile('user-1', { specialty: 'Dermatology' });

    expect(mockRepositories.doctorsRepo.updateByUserId).toHaveBeenCalledWith('user-1', {
      specialty: 'Dermatology',
    });
    expect(result).toEqual(updated);
  });

  it('throws when the doctor profile does not exist', async () => {
    mockRepositories.doctorsRepo.getByUserId.mockResolvedValue(null as any);

    await expect(
      doctorsService.updateProfile('no-such-user', { specialty: 'Cardiology' }),
    ).rejects.toThrow('Doctor profile not found');

    expect(mockRepositories.doctorsRepo.updateByUserId).not.toHaveBeenCalled();
  });
});

describe('listAllAdmin', () => {
  const fakeAdminDoctor = {
    id: 'doc-1',
    userId: 'user-1',
    specialty: 'Cardiology',
    address: '10 Rue de Rivoli, Paris',
    city: 'Paris',
    name: 'Dr. John Doe',
    email: 'john@example.com',
    image: null,
  };

  beforeEach(() => {
    mockRepositories.doctorsRepo.listAllAdmin.mockResolvedValue([fakeAdminDoctor]);
    mockRepositories.doctorsRepo.countAllAdmin.mockResolvedValue(1);
  });

  it('computes offset and delegates to repo', async () => {
    const result = await doctorsService.listAllAdmin({
      page: 2,
      perPage: 10,
      specialty: 'Cardiology',
    });

    expect(mockRepositories.doctorsRepo.listAllAdmin).toHaveBeenCalledWith({
      specialty: 'Cardiology',
      search: undefined,
      city: undefined,
      offset: 10,
      limit: 10,
    });
    expect(result).toEqual({
      doctors: [fakeAdminDoctor],
      totalItems: 1,
      totalPages: 1,
      page: 2,
      perPage: 10,
    });
  });

  it('passes all filters to repo', async () => {
    mockRepositories.doctorsRepo.listAllAdmin.mockResolvedValue([]);
    mockRepositories.doctorsRepo.countAllAdmin.mockResolvedValue(0);

    await doctorsService.listAllAdmin({
      page: 1,
      perPage: 20,
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'smith',
    });

    expect(mockRepositories.doctorsRepo.listAllAdmin).toHaveBeenCalledWith({
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'smith',
      offset: 0,
      limit: 20,
    });
    expect(mockRepositories.doctorsRepo.countAllAdmin).toHaveBeenCalledWith({
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'smith',
    });
  });

  it('computes totalPages correctly', async () => {
    mockRepositories.doctorsRepo.countAllAdmin.mockResolvedValue(25);

    const result = await doctorsService.listAllAdmin({ page: 1, perPage: 10 });

    expect(result.totalPages).toBe(3);
  });

  it('returns empty results with total 0', async () => {
    mockRepositories.doctorsRepo.listAllAdmin.mockResolvedValue([]);
    mockRepositories.doctorsRepo.countAllAdmin.mockResolvedValue(0);

    const result = await doctorsService.listAllAdmin({ page: 1, perPage: 10 });

    expect(result).toEqual({
      doctors: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      perPage: 10,
    });
  });
});

describe('createProfile', () => {
  const createData = { specialty: 'Cardiology', address: '10 Rue Test', city: 'Paris' };
  const fakeCreated = { id: 'doc-new', userId: 'user-1', ...createData };

  it('creates a doctor profile for a user with role doctor', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue({ id: 'user-1', role: 'doctor' } as any);
    mockRepositories.doctorsRepo.getByUserId.mockResolvedValue(null as any);
    mockRepositories.doctorsRepo.createByUserId.mockResolvedValue(fakeCreated as any);

    const result = await doctorsService.createProfile('user-1', createData);

    expect(mockRepositories.usersRepo.findById).toHaveBeenCalledWith({ id: 'user-1' });
    expect(mockRepositories.doctorsRepo.createByUserId).toHaveBeenCalledWith('user-1', createData);
    expect(result).toEqual(fakeCreated);
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue(undefined as any);

    await expect(doctorsService.createProfile('no-user', createData)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws BAD_REQUEST when user role is not doctor', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue({ id: 'user-1', role: 'patient' } as any);

    await expect(doctorsService.createProfile('user-1', createData)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('throws CONFLICT when doctor profile already exists', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue({ id: 'user-1', role: 'doctor' } as any);
    mockRepositories.doctorsRepo.getByUserId.mockResolvedValue(fakeDoctor as any);

    await expect(doctorsService.createProfile('user-1', createData)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
});

describe('service creation', () => {
  it('can be created with required dependencies', () => {
    const service = createDoctorsService(mockRepositories.doctorsRepo, mockRepositories.usersRepo);
    expect(service).toBeDefined();
    expect(typeof service.listBookable).toBe('function');
    expect(typeof service.getByUserId).toBe('function');
    expect(typeof service.updateProfile).toBe('function');
    expect(typeof service.createProfile).toBe('function');
  });
});
