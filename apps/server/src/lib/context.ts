import { fromNodeHeaders } from 'better-auth/node';

import type { auth } from './auth';
import type { Services } from '../db/services';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
export interface CreateContextOptions {
  services?: Services;
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
