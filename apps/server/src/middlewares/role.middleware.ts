/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { TRPCError } from '@trpc/server';

import { isAuthed } from './session.middleware';

export const isPatient = isAuthed.unstable_pipe(({ ctx, next }) => {
  const role = (ctx.session as any).role as string | undefined;
  if (role !== 'patient' && role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Patient access required',
    });
  }
  return next();
});

export const isDoctor = isAuthed.unstable_pipe(({ ctx, next }) => {
  const role = (ctx.session as any).role as string | undefined;
  if (role !== 'doctor' && role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Doctor access required',
    });
  }
  return next();
});
