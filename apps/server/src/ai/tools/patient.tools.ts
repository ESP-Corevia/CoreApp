import { toolDefinition } from '@tanstack/ai';
import { z } from 'zod';
import type { AICaller } from '../caller';

const appointmentsSchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .nullish()
    .describe('Filter by appointment status'),
});

export function createPatientTools(caller: AICaller) {
  const getMyAppointments = toolDefinition({
    name: 'get_my_appointments',
    description: 'Get the list of my upcoming appointments. Optionally filter by status.',
    inputSchema: appointmentsSchema,
  }).server(async args => {
    const input = args as z.infer<typeof appointmentsSchema>;
    return await caller.appointments.listMine({
      status: input.status ?? undefined,
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });
  });

  const getMyTodayPillbox = toolDefinition({
    name: 'get_my_today_pillbox',
    description: 'Get my medication schedule for today — what I need to take and when.',
    inputSchema: z.object({}),
  }).server(async () => {
    return await caller.pillbox.today({});
  });

  return [getMyAppointments, getMyTodayPillbox];
}
