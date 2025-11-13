import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

export const statements = {
  ...defaultStatements,
  account: ['create', 'update', 'delete'] as const,
} as const;

export const ac = createAccessControl(statements);

export const userRole = ac.newRole({
  account: ['create', 'update'],
});

export const adminRole = ac.newRole({
  ...adminAc.statements,
  account: ['create', 'update', 'delete'],
});
export type Permissions = {
  account?: ('create' | 'update' | 'delete')[];
  user?: (
    | 'create'
    | 'update'
    | 'delete'
    | 'list'
    | 'set-role'
    | 'ban'
    | 'impersonate'
    | 'set-password'
    | 'get'
  )[];
  session?: ('delete' | 'list' | 'revoke')[];
};

export const ALL_PERMISSIONS: Permissions = {
  account: ['create', 'update', 'delete'],
  user: [
    'create',
    'update',
    'delete',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'set-password',
    'get',
  ],
  session: ['delete', 'list', 'revoke'],
};
