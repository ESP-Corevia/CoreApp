import { TRPCError } from '@trpc/server';

import { ALL_PERMISSIONS } from '../lib/permissions';

import { isAuthed } from './session.middleware';
export const isAdmin = isAuthed.unstable_pipe(async ({ ctx, next }) => {
  const {
    session: { userId },
    auth,
  } = ctx;
  // Only `userId` is passed on purpose: better-auth resolves the stored role for that user.
  // Passing `role: 'admin'` would make it evaluate the permissions of the admin role itself
  // instead of the caller's, and the check would succeed for every authenticated user.
  const isAdmin = await auth.api.userHasPermission({
    body: {
      userId,
      permissions: ALL_PERMISSIONS,
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
