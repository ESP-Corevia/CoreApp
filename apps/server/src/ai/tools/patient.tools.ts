import { tool } from 'ai';
import { z } from 'zod';
import type { AICaller } from '../caller';

const appointmentsSchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .nullish()
    .describe('Filter by appointment status'),
});

export function createPatientTools(caller: AICaller) {
  return {
    get_my_appointments: tool({
      description: 'Get the list of my upcoming appointments. Optionally filter by status.',
      inputSchema: appointmentsSchema,
      execute: async args => {
        return await caller.appointments.listMine({
          status: args.status ?? undefined,
          page: 1,
          limit: 10,
          sort: 'dateDesc',
        });
      },
    }),

    get_my_today_pillbox: tool({
      description: 'Get my medication schedule for today — what I need to take and when.',
      inputSchema: z.object({}),
      execute: async () => {
        return await caller.pillbox.today({});
      },
    }),
  };
}
