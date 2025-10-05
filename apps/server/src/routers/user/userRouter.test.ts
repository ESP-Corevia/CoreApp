import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller } from '../../../test/caller';
import { mockServices } from '../../../test/services';
beforeEach(() => {});

describe('userRouter', () => {
  describe('getMe', () => {
    it('returns user information when authenticated', async () => {
      const fakeMe = {
        id: faker.string.uuid(),
        name: faker.person.firstName(),
        email: faker.internet.email(),
        createdAt: faker.date.past(),
        updatedAt: null,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
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
