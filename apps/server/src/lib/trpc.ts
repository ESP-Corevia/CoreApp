import { initTRPC } from '@trpc/server';
import type { OpenApiMeta } from 'trpc-to-openapi';
import type { Context } from './context';
export const t = initTRPC.meta<OpenApiMeta>().context<Context>().create();
