import { TRPCError } from '@trpc/server';

import { ALL_PERMISSIONS } from '../lib/permissions';

import { isAuthed } from './session.middleware';
export const isAdmin = isAuthed.unstable_pipe(async ({ ctx, next }) => {
  const {
    session: { userId },
    auth,
  } = ctx;
  const isAdmin = await auth.api.userHasPermission({
    body: {
      userId,
      role: 'admin',
      permission: ALL_PERMISSIONS,
    },
  });
  if (!isAdmin.success) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be an admin to access this resource',
    });
  }
  return next();
});
