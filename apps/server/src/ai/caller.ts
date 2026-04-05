import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Services } from '../db/services';
import type { auth as Auth } from '../lib/auth';
import { appRouter } from '../routers';

export function createAICaller({
  session,
  req,
  res,
  auth,
  services,
}: {
  session: NonNullable<Awaited<ReturnType<typeof Auth.api.getSession>>>;
  req: FastifyRequest;
  res: FastifyReply;
  auth: typeof Auth;
  services: Services;
}) {
  return appRouter.createCaller({
    session,
    req,
    res,
    auth,
    services,
  });
}

export type AICaller = ReturnType<typeof createAICaller>;
