import { initTRPC } from '@trpc/server';

import type { Context } from './context';
import type { OpenApiMeta } from 'trpc-to-openapi';
export const t = initTRPC.meta<OpenApiMeta>().context<Context>().create();
