import { toolDefinition } from '@tanstack/ai';
import { z } from 'zod';
import type { AICaller } from '../createCaller';

export function createAdminTools(caller: AICaller) {
  // --- list_users ---
  const listUsersDef = toolDefinition({
    name: 'list_users',
    description: 'List all users in the system with optional search.',
    inputSchema: z.object({
      search: z.string().nullish().describe('Search by name or email'),
      page: z.number().int().positive().nullish().describe('Page number'),
    }),
  });

  const listUsers = listUsersDef.server(async (input) => {
    const result = await caller.admin.listUsers({
      page: input.page ?? 1,
      perPage: 10,
      search: input.search ?? undefined,
    });
    return result;
  });

  // --- view_audit_events ---
  const viewAuditEventsDef = toolDefinition({
    name: 'view_audit_events',
    description: 'View recent audit events and activity logs.',
    inputSchema: z.object({}),
  });

  // TODO: Wire to a real audit log procedure when available
  const viewAuditEvents = viewAuditEventsDef.server(async () => {
    return {
      events: [
        { id: '1', action: 'user.login', userId: 'u_1', timestamp: new Date().toISOString() },
        { id: '2', action: 'appointment.created', userId: 'u_2', timestamp: new Date().toISOString() },
      ],
      _note: 'STUB — wire to real audit log procedure when available',
    };
  });

  return [listUsers, viewAuditEvents];
}
