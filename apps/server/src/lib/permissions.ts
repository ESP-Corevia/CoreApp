import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

export const statements = {
  ...defaultStatements,
  account: ['create', 'update', 'delete'] as const,
  panel: ['access'] as const,
  appointment: ['create', 'list', 'view'] as const,
  doctorPanel: ['access', 'manage-blocks'] as const,
} as const;

export const ac = createAccessControl(statements);

export const patientRole = ac.newRole({
  account: ['create', 'update'],
  appointment: ['create', 'list', 'view'],
});

export const doctorRole = ac.newRole({
  account: ['create', 'update'],
  doctorPanel: ['access', 'manage-blocks'],
});

export const adminRole = ac.newRole({
  ...adminAc.statements,
  account: ['create', 'update', 'delete'],
  panel: ['access'],
  appointment: ['create', 'list', 'view'],
  doctorPanel: ['access', 'manage-blocks'],
});

export type Permissions = {
  account?: ('create' | 'update' | 'delete')[];
  panel?: 'access'[];
  appointment?: ('create' | 'list' | 'view')[];
  doctorPanel?: ('access' | 'manage-blocks')[];
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
  panel: ['access'],
  appointment: ['create', 'list', 'view'],
  doctorPanel: ['access', 'manage-blocks'],
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
