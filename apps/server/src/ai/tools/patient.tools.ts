import { toolDefinition } from '@tanstack/ai';
import { z } from 'zod';
import type { AICaller } from '../createCaller';

export function createPatientTools(caller: AICaller) {
  // --- get_my_appointments ---
  const getMyAppointmentsDef = toolDefinition({
    name: 'get_my_appointments',
    description:
      'Get the list of my upcoming appointments. Optionally filter by status.',
    inputSchema: z.object({
      status: z
        .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
        .nullish()
        .describe('Filter by appointment status'),
    }),
  });

  const getMyAppointments = getMyAppointmentsDef.server(async (input) => {
    const result = await caller.appointments.listMine({
      status: input.status ?? undefined,
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });
    return result;
  });

  // --- get_my_today_pillbox ---
  const getMyTodayPillboxDef = toolDefinition({
    name: 'get_my_today_pillbox',
    description:
      'Get my medication schedule for today — what I need to take and when.',
    inputSchema: z.object({}),
  });

  const getMyTodayPillbox = getMyTodayPillboxDef.server(async () => {
    const result = await caller.pillbox.today({});
    return result;
  });

  return [getMyAppointments, getMyTodayPillbox];
}
