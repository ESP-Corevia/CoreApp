import { t } from '../lib/trpc';

import { isAuthed } from './session.middleware';

export const router = t.router;
// ts-prune-ignore-next
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
