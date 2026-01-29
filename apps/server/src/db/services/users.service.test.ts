import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRepositories } from '../../../test/repositories';

import { createUsersService } from './users.service';

import type { QueryParams } from '../../utils/db';
import type { users } from '../schema';
const userService = createUsersService(mockRepositories.usersRepo);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('findById', () => {
  it('delegates to repo.findById with correct parameters', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      createdAt: new Date(),
      updatedAt: null,
      image: null,
      emailVerified: true,
      role: 'user',
      banned: false,
      banReason: '',
      banExpires: null,
      lastLoginMethod: 'google',
      seeded: false,
    };

    mockRepositories.usersRepo.findById.mockResolvedValue(mockUser);

    const result = await userService.findById({ id: 'user-123' });

    expect(result).toEqual(mockUser);
    expect(mockRepositories.usersRepo.findById).toHaveBeenCalledWith({
      id: 'user-123',
    });
  });

  it('returns null when user not found', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue(undefined);

    const result = await userService.findById({ id: 'non-existent' });

    expect(result).toBeUndefined();
    expect(mockRepositories.usersRepo.findById).toHaveBeenCalledWith({
      id: 'non-existent',
    });
  });
});
describe('findByEmail', () => {
  it('delegates to repo.findByEmail with correct parameters', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      createdAt: new Date(),
      updatedAt: null,
      image: null,
      emailVerified: true,
      role: 'user',
      banned: false,
      banReason: '',
      banExpires: null,
      lastLoginMethod: 'google',
      seeded: false,
    };

    mockRepositories.usersRepo.findByEmail.mockResolvedValue(mockUser);

    const result = await userService.findByEmail('john.doe@example.com');

    expect(result).toEqual(mockUser);
    expect(mockRepositories.usersRepo.findByEmail).toHaveBeenCalledWith('john.doe@example.com');
  });

  it('returns null when user not found', async () => {
    mockRepositories.usersRepo.findByEmail.mockResolvedValue(undefined);

    const result = await userService.findByEmail('non-existent@example.com');

    expect(result).toBeUndefined();
    expect(mockRepositories.usersRepo.findByEmail).toHaveBeenCalledWith('non-existent@example.com');
  });
});
describe('getMe', () => {
  it('returns user profile with existing API key', async () => {
    const mockUser = {
      id: 'user-123',

      email: 'john.doe@example.com',
      name: 'John Doe',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      image: 'https://example.com/avatar.jpg',
      emailVerified: true,
      role: 'user',
      banned: false,
      banReason: '',
      banExpires: null,
      lastLoginMethod: 'google',
      seeded: false,
    };

    mockRepositories.usersRepo.findById.mockResolvedValue(mockUser);

    const result = await userService.getMe('user-123');

    expect(result).toEqual({
      id: 'user-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      image: 'https://example.com/avatar.jpg',
      lastLoginMethod: 'google',
      emailVerified: true,
      role: 'user',
    });

    expect(mockRepositories.usersRepo.findById).toHaveBeenCalledWith({
      id: 'user-123',
    });
  });

  it('throws error when user not found', async () => {
    mockRepositories.usersRepo.findById.mockResolvedValue(undefined);

    await expect(userService.getMe('non-existent')).rejects.toThrow('User not found');

    expect(mockRepositories.usersRepo.findById).toHaveBeenCalledWith({
      id: 'non-existent',
    });
  });

  it('handles user with null image correctly', async () => {
    const mockUser = {
      id: 'user-null-image',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: null,
      lastLoginAt: null,
      lastLoginIp: null,
      image: null,
      emailVerified: true,
      role: 'user',
      banned: false,
      banReason: '',
      banExpires: null,
      lastLoginMethod: 'google',
      seeded: false,
    };

    mockRepositories.usersRepo.findById.mockResolvedValue(mockUser);

    const result = await userService.getMe('user-null-image');

    expect(result.image).toBeNull();
  });
});
describe('listUsers', () => {
  it('delegates to repo.listUsers with correctly built query options and pagination', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      image: 'https://example.com/avatar.jpg',
      emailVerified: true,
      role: 'user',
      banned: false,
      banReason: '',
      banExpires: null,
      lastLoginMethod: 'google',
      seeded: false,
    };
    const mockResult = {
      users: [mockUser],
      totalItems: 1,
      totalPages: 1,
      page: 1,
      perPage: 10,
    };

    mockRepositories.usersRepo.listUsers.mockResolvedValue(mockResult);

    const params: QueryParams<typeof users> = {
      page: 1,
      perPage: 10,
      search: 'john',
      searchInFields: ['email'],
      filters: [],
      sorting: undefined,
    };

    const result = await userService.listUsers({
      params,
      userId: 'user-1',
    });

    expect(mockRepositories.usersRepo.listUsers).toHaveBeenCalledTimes(1);

    const callArgs = mockRepositories.usersRepo.listUsers.mock.calls[0][0];

    expect(callArgs.userId).toBe('user-1');

    expect(callArgs.pageParams).toEqual({ page: 1, perPage: 10 });

    expect(callArgs.options).toHaveProperty('where');
    expect(callArgs.options).toHaveProperty('limit', 10);
    expect(callArgs.options).toHaveProperty('offset', 0);

    expect(result).toEqual(mockResult);
  });

  it('correctly handles empty params and default pagination', async () => {
    const mockResult = {
      users: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      perPage: 10,
    };

    mockRepositories.usersRepo.listUsers.mockResolvedValue(mockResult);

    const result = await userService.listUsers({
      params: {},
      userId: 'user-123',
    });

    expect(mockRepositories.usersRepo.listUsers).toHaveBeenCalledWith({
      userId: 'user-123',
      pageParams: { page: undefined, perPage: undefined },
      options: expect.any(Object),
    });

    expect(result).toEqual(mockResult);
  });

  it('passes filters and sorting parameters correctly', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      image: 'https://example.com/avatar.jpg',
      emailVerified: true,
      role: 'user',
      banned: false,
      banReason: '',
      banExpires: null,
      lastLoginMethod: 'google',
      seeded: false,
    };
    const mockResult = {
      users: [mockUser],
      totalItems: 1,
      totalPages: 1,
      page: 1,
      perPage: 5,
    };

    mockRepositories.usersRepo.listUsers.mockResolvedValue(mockResult);

    const params: QueryParams<typeof users> = {
      page: 1,
      perPage: 5,
      filters: [
        {
          id: 'emailVerified',
          operator: 'eq',
          value: 'true',
          variant: 'boolean',
          filterId: 'filter-1',
        },
      ],
      sorting: {
        id: 'email',
        desc: true,
      },
    };

    const result = await userService.listUsers({
      params,
      userId: 'requesting-user',
    });

    expect(mockRepositories.usersRepo.listUsers).toHaveBeenCalledWith({
      userId: 'requesting-user',
      pageParams: { page: 1, perPage: 5 },
      options: expect.objectContaining({
        where: expect.anything(),
        orderBy: expect.any(Function),
        limit: 5,
        offset: 0,
      }),
    });

    expect(result).toEqual(mockResult);
  });

  it('handles repo.listUsers returning empty users array', async () => {
    mockRepositories.usersRepo.listUsers.mockResolvedValue({
      users: [],
      totalItems: 0,
      totalPages: 0,
      page: 2,
      perPage: 10,
    });

    const result = await userService.listUsers({
      params: { page: 2, perPage: 10 },
      userId: 'abc',
    });

    expect(result.users).toEqual([]);
    expect(result.totalPages).toBe(0);
    expect(result.totalItems).toBe(0);
  });
});

describe('service creation', () => {
  it('can be created with required dependencies', () => {
    const customService = createUsersService(mockRepositories.usersRepo);
    expect(customService).toBeDefined();
    expect(typeof customService.findById).toBe('function');
    expect(typeof customService.getMe).toBe('function');
    expect(typeof customService.findByEmail).toBe('function');
  });
});
