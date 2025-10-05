import { mockDeep } from 'vitest-mock-extended';

import { appRouter } from '../src/routers';

import { mockServices } from './services';
// import { mockLogger } from './setup';

import type { auth as betterAuth } from '../src/lib/auth';
import type { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
// const fastify = mockDeep<FastifyInstance>();
const session = mockDeep<Awaited<ReturnType<typeof betterAuth.api.getSession>>>();
export const authMock = mockDeep<typeof betterAuth>();
export function createTestCaller({
  req = mockDeep<FastifyRequest>(),
  res = mockDeep<FastifyReply>(),
  customSession,
  auth = authMock,
}: {
  req?: FastifyRequest;
  res?: FastifyReply;
  customSession?: Awaited<ReturnType<typeof auth.api.getSession>>;
  auth?: typeof betterAuth;
}) {
  const sessionToUse = customSession === undefined ? session : customSession;
  return appRouter.createCaller({
    req,
    res,
    services: mockServices,
    session: sessionToUse,
    auth,
    // logger: () => mockLogger,
  });
}
