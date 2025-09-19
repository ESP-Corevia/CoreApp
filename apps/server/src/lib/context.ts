import { fromNodeHeaders } from 'better-auth/node';

import { auth } from './auth';

import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return { session, req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
