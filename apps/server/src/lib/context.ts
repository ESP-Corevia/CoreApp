import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { fromNodeHeaders } from 'better-auth/node';
import type { Services } from '../db/services';
import type { auth } from './auth';
export interface CreateContextOptions {
  services: Services;
  // fastify: FastifyInstance;
  auth: typeof auth;
}

export async function createContext({
  req,
  res,
  auth,
  services,
}: CreateFastifyContextOptions & CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return { session, req, res, auth, services };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
