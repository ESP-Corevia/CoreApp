import { toolDefinition } from '@tanstack/ai';
import { z } from 'zod';
import type { AICaller } from '../createCaller';

export function createDoctorTools(caller: AICaller) {
  // --- get_my_appointments ---
  const getMyAppointmentsDef = toolDefinition({
    name: 'get_my_appointments',
    description:
      'Get the list of my appointments as a doctor. Optionally filter by status.',
    inputSchema: z.object({
      status: z
        .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
        .nullish()
        .describe('Filter by appointment status'),
    }),
  });

  const getMyAppointments = getMyAppointmentsDef.server(async (input) => {
    const result = await caller.doctor.appointments.listMine({
      status: input.status ?? undefined,
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });
    return result;
  });

  // --- get_appointment_detail ---
  const getAppointmentDetailDef = toolDefinition({
    name: 'get_appointment_detail',
    description: 'Get the full details of a specific appointment by its ID.',
    inputSchema: z.object({
      id: z.string().uuid().describe('The appointment ID'),
    }),
  });

  const getAppointmentDetail = getAppointmentDetailDef.server(async (input) => {
    const result = await caller.doctor.appointments.detail({ id: input.id });
    return result;
  });

  // --- update_appointment_status ---
  const updateAppointmentStatusDef = toolDefinition({
    name: 'update_appointment_status',
    description:
      'Update the status of an appointment (confirm, complete, or cancel it).',
    inputSchema: z.object({
      id: z.string().uuid().describe('The appointment ID'),
      status: z
        .enum(['CONFIRMED', 'COMPLETED', 'CANCELLED'])
        .describe('The new status'),
    }),
  });

  const updateAppointmentStatus = updateAppointmentStatusDef.server(async (input) => {
    const result = await caller.doctor.appointments.updateStatus({
      id: input.id,
      status: input.status,
    });
    return result;
  });

  return [getMyAppointments, getAppointmentDetail, updateAppointmentStatus];
}
