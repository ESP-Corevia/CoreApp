import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRepositories } from '../../../test/repositories';

import { createUsersService } from './users.service';

const userService = createUsersService(mockRepositories.usersRepo);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('findById', () => {
  it('delegates to repo.findById with correct parameters', async () => {
    const mockUser = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
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
      firstName: 'John',
      lastName: 'Doe',
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
      firstName: 'John',
      lastName: 'Doe',
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
    };

    mockRepositories.usersRepo.findById.mockResolvedValue(mockUser);

    const result = await userService.getMe('user-123');

    expect(result).toEqual({
      id: 'user-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      firstName: 'John',
      lastName: 'Doe',
      image: 'https://example.com/avatar.jpg',
      lastLoginMethod: 'google',
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
      firstName: 'Test',
      lastName: 'User',
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
    };

    mockRepositories.usersRepo.findById.mockResolvedValue(mockUser);

    const result = await userService.getMe('user-null-image');

    expect(result.image).toBeNull();
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
