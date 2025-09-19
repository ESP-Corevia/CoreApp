import { mockDeep } from 'vitest-mock-extended';

import { appRouter } from '../src/routers';

// import { mockServices } from './services';
// import { mockLogger } from './setup';

import type { auth } from '../src/lib/auth';
import type { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
// const req = mockDeep<FastifyRequest>();
// const res = mockDeep<FastifyReply>();
// const fastify = mockDeep<FastifyInstance>();
const session = mockDeep<Awaited<ReturnType<typeof auth.api.getSession>>>();

export function createTestCaller({
  req = mockDeep<FastifyRequest>(),
  res = mockDeep<FastifyReply>(),
  customSession,
}: {
  req?: FastifyRequest;
  res?: FastifyReply;
  customSession?: Awaited<ReturnType<typeof auth.api.getSession>>;
}) {
  const sessionToUse = customSession === undefined ? session : customSession;
  return appRouter.createCaller({
    req,
    res,
    // services: mockServices,
    session: sessionToUse,
    // logger: () => mockLogger,
  });
}
