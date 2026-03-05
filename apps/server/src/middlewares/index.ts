import { t } from '../lib/trpc';

import { isAdmin } from './admin.middleware';
import { isDoctor, isPatient } from './role.middleware';
import { isAuthed } from './session.middleware';
export const router = t.router;
// ts-prune-ignore-next
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const patientProcedure = t.procedure.use(isPatient);
export const doctorProcedure = t.procedure.use(isDoctor);
export const adminProcedure = t.procedure.use(isAdmin);
