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

  describe('getAiMetrics', () => {
    beforeEach(() => {
      mockServices.aiMetricsService.getMetrics.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('returns AI metrics using default filters', async () => {
      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: 'admin-user' },
      });

      const mockResponse = {
        isMock: true as const,
        generatedAt: new Date('2026-03-02T10:00:00.000Z'),
        period: {
          preset: '30d' as const,
          from: new Date('2026-02-01T00:00:00.000Z'),
          to: new Date('2026-03-02T00:00:00.000Z'),
          groupBy: 'day' as const,
        },
        summary: {
          totalCostUsd: 42.12,
          totalTokens: 120_000,
          totalRequests: 2_100,
          totalConversations: 820,
          activeUsers: 340,
          errorRate: 1.34,
        },
        trend: [
          {
            date: new Date('2026-03-01T00:00:00.000Z'),
            costUsd: 1.22,
            tokens: 5_020,
            requests: 102,
            conversations: 41,
            errorRate: 1.11,
          },
        ],
        byUser: [
          {
            userId: 'mobile-u-001',
            userName: 'Alex Martin',
            userEmail: 'alex.martin@corevia.app',
            costUsd: 6.32,
            tokens: 20_000,
            requests: 310,
            conversations: 115,
            errorRate: 0.98,
          },
        ],
        byFeature: [
          {
            feature: 'chat',
            costUsd: 18.31,
            tokens: 60_000,
            requests: 1_020,
            conversations: 520,
            errorRate: 1.02,
            activeUsers: 220,
          },
        ],
      };

      mockServices.aiMetricsService.getMetrics.mockResolvedValue(mockResponse);

      const result = await caller.admin.getAiMetrics({});

      expect(result).toEqual(mockResponse);
      expect(mockServices.aiMetricsService.getMetrics).toHaveBeenCalledWith({
        params: {
          preset: '30d',
          from: undefined,
          to: undefined,
          groupBy: 'day',
          limit: 10,
        },
        requesterUserId: 'admin-user',
      });
    });

    it('forwards custom filter values to the service', async () => {
      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: 'admin-user' },
      });

      const from = new Date('2026-01-01T00:00:00.000Z');
      const to = new Date('2026-01-31T23:59:59.999Z');

      const mockResponse = {
        isMock: true as const,
        generatedAt: new Date('2026-03-02T10:00:00.000Z'),
        period: {
          preset: 'custom' as const,
          from,
          to,
          groupBy: 'week' as const,
        },
        summary: {
          totalCostUsd: 10,
          totalTokens: 1_000,
          totalRequests: 120,
          totalConversations: 40,
          activeUsers: 32,
          errorRate: 1.01,
        },
        trend: [],
        byUser: [],
        byFeature: [],
      };

      mockServices.aiMetricsService.getMetrics.mockResolvedValue(mockResponse);

      const result = await caller.admin.getAiMetrics({
        preset: 'custom',
        from,
        to,
        groupBy: 'week',
        limit: 5,
      });

      expect(result).toEqual(mockResponse);
      expect(mockServices.aiMetricsService.getMetrics).toHaveBeenCalledWith({
        params: {
          preset: 'custom',
          from,
          to,
          groupBy: 'week',
          limit: 5,
        },
        requesterUserId: 'admin-user',
      });
    });

    it('returns not authenticated error when session is not authenticated', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.admin.getAiMetrics({})).rejects.toThrow('Authentication required');
    });

    it('returns not authorized error when user is not admin', async () => {
      authMock.api.userHasPermission.mockResolvedValue({
        success: false,
        error: null,
      });
      const caller = createTestCaller({
        customSession: fakeSession,
      });

      await expect(caller.admin.getAiMetrics({})).rejects.toThrow(
        'You must be an admin to access this resource',
      );
    });
  });
});
