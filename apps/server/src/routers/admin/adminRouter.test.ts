import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, authMock, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

describe('adminRouter', () => {
  describe('isAdmin', () => {
    it('returns true when user is admin', async () => {
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
      const caller = createTestCaller({
        customSession: fakeSession,
      });
      const res = await caller.admin.isAdmin({});
      expect(res).toEqual(true);
    });
  });

  it('returns Not authenticated error when session is not authenticated', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.admin.isAdmin({})).rejects.toThrow('Authentication required');
  });
  it('returns Not authorized error when user is not admin', async () => {
    authMock.api.userHasPermission.mockResolvedValue({
      success: false,
      error: null,
    });
    const caller = createTestCaller({
      customSession: fakeSession,
    });
    await expect(caller.admin.isAdmin({})).rejects.toThrow(
      'You must be an admin to access this resource',
    );
  });
  describe('listUsers', () => {
    beforeEach(() => {
      mockServices.usersService.listUsers.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });
    it('returns paginated users from the service with parsed filters & sorting', async () => {
      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: 'test-user-123' },
      });

      const mockResponse = {
        users: [
          {
            id: 'u1',
            email: 'john@example.com',
            name: 'John Doe',
            role: 'user',
            createdAt: new Date('2024-01-01'),
            updatedAt: null,
            emailVerified: true,
            image: null,
            banned: false,
            banReason: null,
            banExpires: null,
            lastLoginMethod: 'google',
          },
        ],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        perPage: 10,
      };

      mockServices.usersService.listUsers.mockResolvedValue({
        ...mockResponse,
        users: mockResponse.users.map((u) => ({
          ...u,
          seeded: false,
        })),
      });

      const result = await caller.admin.listUsers({
        page: 1,
        perPage: 10,
        search: 'john',
        searchInFields: ['email', 'name'],
        sorting: JSON.stringify({ id: 'email', desc: true }),
        filters: JSON.stringify([
          {
            id: 'emailVerified',
            operator: 'eq',
            value: true,
            variant: 'boolean',
            filterId: 'flt-1',
          },
        ]),
      });

      expect(result).toEqual(mockResponse);

      expect(mockServices.usersService.listUsers).toHaveBeenCalledWith({
        params: {
          page: 1,
          perPage: 10,
          search: 'john',
          searchInFields: ['email', 'name'],
          sorting: { id: 'email', desc: true },
          filters: [
            {
              id: 'emailVerified',
              operator: 'eq',
              value: true,
              variant: 'boolean',
              filterId: 'flt-1',
            },
          ],
        },
        userId: 'test-user-123',
      });
    });

    it('works with minimal input', async () => {
      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: 'admin-user' },
      });

      const emptyResponse = {
        users: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        perPage: 10,
      };

      mockServices.usersService.listUsers.mockResolvedValue(emptyResponse);

      const result = await caller.admin.listUsers({
        page: 1,
        perPage: 10,
      });

      expect(result).toEqual(emptyResponse);

      expect(mockServices.usersService.listUsers).toHaveBeenCalledWith({
        params: {
          page: 1,
          perPage: 10,
          search: undefined,
          searchInFields: ['email', 'name'], // default
          sorting: undefined,
          filters: undefined,
        },
        userId: 'admin-user',
      });
    });
  });
});
