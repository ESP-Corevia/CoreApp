import { toolDefinition } from '@tanstack/ai';
import { z } from 'zod';
import type { AICaller } from '../caller';

const appointmentsSchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .nullish()
    .describe('Filter by appointment status'),
});

const appointmentDetailSchema = z.object({
  id: z.uuid().describe('The appointment ID'),
});

const updateStatusSchema = z.object({
  id: z.uuid().describe('The appointment ID'),
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']).describe('The new status'),
});

export function createDoctorTools(caller: AICaller) {
  const getMyAppointments = toolDefinition({
    name: 'get_my_appointments',
    description: 'Get the list of my appointments as a doctor. Optionally filter by status.',
    inputSchema: appointmentsSchema,
  }).server(async args => {
    const input = args as z.infer<typeof appointmentsSchema>;
    return await caller.doctor.appointments.listMine({
      status: input.status ?? undefined,
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });
  });

  const getAppointmentDetail = toolDefinition({
    name: 'get_appointment_detail',
    description: 'Get the full details of a specific appointment by its ID.',
    inputSchema: appointmentDetailSchema,
  }).server(async args => {
    const input = args as z.infer<typeof appointmentDetailSchema>;
    return await caller.doctor.appointments.detail({ id: input.id });
  });

  const updateAppointmentStatus = toolDefinition({
    name: 'update_appointment_status',
    description: 'Update the status of an appointment (confirm, complete, or cancel it).',
    inputSchema: updateStatusSchema,
  }).server(async args => {
    const input = args as z.infer<typeof updateStatusSchema>;
    return await caller.doctor.appointments.updateStatus({
      id: input.id,
      status: input.status,
    });
  });

  return [getMyAppointments, getAppointmentDetail, updateAppointmentStatus];
}
