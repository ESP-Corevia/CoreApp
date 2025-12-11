import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, fakeSession } from '../../test/caller';

beforeEach(() => {});

describe('helloWorldRouter', () => {
  it('returns default greeting when name omitted', async () => {
    const caller = createTestCaller({
      customSession: fakeSession,
    });
    const result = await caller.helloWorld({});
    expect(result).toEqual({ message: 'Hello, Guest from Corevia !' });
  });

  it('returns personalized greeting when name provided', async () => {
    const caller = createTestCaller({
      customSession: fakeSession,
    });
    const result = await caller.helloWorld({ name: 'John' });
    expect(result).toEqual({ message: 'Hello, John from Corevia !' });
  });

  it('returns Not authenticated error when session is not authenticated', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.helloWorld({ name: 'John' })).rejects.toThrow('Authentication required');
  });
});
