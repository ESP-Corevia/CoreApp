import { mockDeep } from 'vitest-mock-extended';

import { appRouter } from '../src/routers';

import { mockServices } from './services';

// import { mockLogger } from './setup';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { auth as betterAuth } from '../src/lib/auth';

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
const baseFakeSession = {
  isAuthenticated: true,
  userId: 'u_1',
  impersonatedBy: null,
  id: 'session_1',
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(),
  token: 'token_123',
};

export const fakeSession = { ...baseFakeSession, role: 'patient' };
export const fakeDoctorSession = { ...baseFakeSession, userId: 'doc_1', role: 'doctor' };
export const fakeAdminSession = { ...baseFakeSession, userId: 'admin_1', role: 'admin' };
