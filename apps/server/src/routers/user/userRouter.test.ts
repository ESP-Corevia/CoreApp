import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller } from '../../../test/caller';
import { mockServices } from '../../../test/services';
beforeEach(() => {});

describe('userRouter', () => {
  describe('getMe', () => {
    it('returns user information when authenticated', async () => {
      const fakeMe = {
        id: 'test-user-123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: null,
        firstName: 'John',
        lastName: 'Doe',
        image: null,
        lastLoginMethod: null,
      };
      mockServices.usersService.getMe.mockResolvedValue(fakeMe);

      const caller = createTestCaller({
        customSession: { isAuthenticated: true, userId: 'test-user-123' },
      });
      const res = await caller.user.getMe({});
      expect(res).toEqual({ user: fakeMe });
      expect(mockServices.usersService.getMe).toHaveBeenCalledWith('test-user-123');
    });
  });

  it('returns Not authenticated error when session is not authenticated', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.user.getMe({})).rejects.toThrow('Authentication required');
  });
});
