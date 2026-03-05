/* eslint-disable require-await */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRepositories } from '../../../test/repositories';

import { createDoctorsService } from './doctors.service';

const doctorsService = createDoctorsService(mockRepositories.doctorsRepo);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

const fakeDoctor = {
  id: 'doc-1',
  name: 'Dr. Alice Martin',
  specialty: 'Cardiology',
  address: '10 Rue de Rivoli, Paris',
  city: 'Paris',
  imageUrl: null,
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
    expect(result).toEqual({
      items: [fakeDoctor],
      page: 2,
      limit: 10,
      total: 1,
    });
  });

  it('passes all filters to repo', async () => {
    mockRepositories.doctorsRepo.listBookable.mockResolvedValue([]);
    mockRepositories.doctorsRepo.countBookable.mockResolvedValue(0);

    await doctorsService.listBookable({
      page: 1,
      limit: 20,
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'dupont',
    });

    expect(mockRepositories.doctorsRepo.listBookable).toHaveBeenCalledWith({
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'dupont',
      offset: 0,
      limit: 20,
    });
    expect(mockRepositories.doctorsRepo.countBookable).toHaveBeenCalledWith({
      specialty: 'Dermatology',
      city: 'Lyon',
      search: 'dupont',
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

describe('service creation', () => {
  it('can be created with required dependencies', () => {
    const service = createDoctorsService(mockRepositories.doctorsRepo);
    expect(service).toBeDefined();
    expect(typeof service.listBookable).toBe('function');
  });
});
