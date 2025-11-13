import { describe, it, expect } from 'vitest';

import { authMock } from '../../test/caller';
import { user } from '../../test/faker';

import { createContext } from './context';
describe('createContext', () => {
  it('return a context with the session and relays req/res/auth', async () => {
    const fakeSession = { isAuthenticated: true, userId: 'u_1' };
    authMock.api.getSession.mockResolvedValue(fakeSession);

    const req = {
      headers: {
        cookie: 'sid=abc',
        'x-test': '1',
      },
    };
    const res = {};

    const ctx = await createContext({ req, res, auth: authMock, services: undefined } as any);

    expect(authMock.api.getSession).toHaveBeenCalledTimes(1);
    expect((authMock.api.getSession as any).mock.calls[0][0]).toMatchObject({
      headers: expect.any(Object),
    });

    expect(ctx.session).toBe(fakeSession);
    expect(ctx.req).toBe(req);
    expect(ctx.res).toBe(res);
    expect(ctx.auth).toBe(authMock);
    expect(ctx.services).toBeUndefined();
  });

  it('handles errors from getSession', async () => {
    authMock.api.getSession.mockRejectedValue(new Error('boom'));

    await expect(
      createContext({
        req: { headers: {} },
        res: {},
        auth: authMock,
        services: undefined,
      } as any),
    ).rejects.toThrow('boom');
  });
});
