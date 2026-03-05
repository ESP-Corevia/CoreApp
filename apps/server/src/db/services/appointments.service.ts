import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { BASE_SLOTS } from './availability.service';

import type { createAppointmentsRepo } from '../repositories/appointments.repository';

function getParisNow(): { date: string; time: string } {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
  const time = now.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return { date, time };
}

export const CreateAppointmentInputSchema = z.object({
  doctorId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'time must be HH:mm'),
  reason: z.string().optional(),
});

export const AppointmentOutputSchema = z.object({
  id: z.string(),
  doctorId: z.uuid(),
  patientId: z.uuid(),
  date: z.string(),
  time: z.string(),
  status: z.string(),
});

export const createAppointmentsService = (repo: ReturnType<typeof createAppointmentsRepo>) => ({
  createAppointment: async (
    patientId: string,
    input: z.infer<typeof CreateAppointmentInputSchema>,
  ) => {
    // Validate slot is a valid base slot
    if (!BASE_SLOTS.includes(input.time)) {
      throw new TRPCError({
        code: 'UNPROCESSABLE_CONTENT',
        message: `Invalid time slot: ${input.time}. Must be a valid 30-minute slot.`,
      });
    }

    // Validate date/time is in the future (Europe/Paris)
    const paris = getParisNow();
    if (input.date < paris.date || (input.date === paris.date && input.time <= paris.time)) {
      throw new TRPCError({
        code: 'UNPROCESSABLE_CONTENT',
        message: 'Cannot book an appointment in the past',
      });
    }

    const result = await repo.createAppointmentAtomic({
      doctorId: input.doctorId,
      patientId,
      date: input.date,
      time: input.time,
      reason: input.reason,
    });

    if ('conflict' in result) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This time slot is already booked',
      });
    }

    if ('blocked' in result) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This time slot is blocked by the doctor',
      });
    }

    return result.appointment;
  },
});
