import { tool } from 'ai';
import { z } from 'zod';
import type { AICaller } from '../caller';

const appointmentsSchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .nullish()
    .describe('Filter by appointment status'),
});

const appointmentDetailSchema = z.object({
  id: z.string().describe('The appointment ID'),
});

const updateStatusSchema = z.object({
  id: z.string().describe('The appointment ID'),
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']).describe('The new status'),
});

export function createDoctorTools(caller: AICaller) {
  return {
    get_my_appointments: tool({
      description: 'Get the list of my appointments as a doctor. Optionally filter by status.',
      inputSchema: appointmentsSchema,
      execute: async args => {
        return await caller.doctor.appointments.listMine({
          status: args.status ?? undefined,
          page: 1,
          limit: 10,
          sort: 'dateDesc',
        });
      },
    }),

    get_appointment_detail: tool({
      description: 'Get the full details of a specific appointment by its ID.',
      inputSchema: appointmentDetailSchema,
      execute: async args => {
        return await caller.doctor.appointments.detail({ id: args.id });
      },
    }),

    update_appointment_status: tool({
      description: 'Update the status of an appointment (confirm, complete, or cancel it).',
      needsApproval: true,
      inputSchema: updateStatusSchema,
      execute: async args => {
        return await caller.doctor.appointments.updateStatus({
          id: args.id,
          status: args.status,
        });
      },
    }),
  };
}
