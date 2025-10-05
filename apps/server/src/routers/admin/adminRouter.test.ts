import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, authMock } from '../../../test/caller';
beforeEach(() => {});

describe('adminRouter', () => {
  describe('isAdmin', () => {
    it('returns true when user is admin', async () => {
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
      const caller = createTestCaller({
        customSession: { isAuthenticated: true, userId: 'test-user-123' },
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
      customSession: { isAuthenticated: true, userId: 'test-user-123' },
    });
    await expect(caller.admin.isAdmin({})).rejects.toThrow(
      'You must be an admin to access this resource',
    );
  });
});
