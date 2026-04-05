import { describe, expect, it, vi } from 'vitest';

const createCallerMock = vi.fn();

vi.mock('../routers', () => ({
  appRouter: {
    createCaller: createCallerMock,
  },
}));

describe('createAICaller', () => {
  it('delegates to appRouter.createCaller with the provided context', async () => {
    const expectedCaller = { admin: {}, doctor: {} };
    createCallerMock.mockReturnValueOnce(expectedCaller);

    const { createAICaller } = await import('./caller');

    const input = {
      session: { userId: 'user-1', role: 'admin' },
      req: { id: 'req-1' },
      res: { statusCode: 200 },
      auth: { api: {} },
      services: { users: {} },
    } as never;

    const caller = createAICaller(input);

    expect(createCallerMock).toHaveBeenCalledWith(input);
    expect(caller).toBe(expectedCaller);
  });
});
