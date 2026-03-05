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

const DoctorSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.string(),
  address: z.string(),
  imageUrl: z.string().nullable(),
});

const AppointmentWithDoctorSchema = AppointmentOutputSchema.extend({
  reason: z.string().nullable(),
  doctor: DoctorSummarySchema,
});

export const AppointmentDetailOutputSchema = AppointmentOutputSchema.extend({
  reason: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
  doctor: DoctorSummarySchema,
});

export const AppointmentDetailInputSchema = z.object({
  id: z.uuid(),
});

export const ListAppointmentsInputSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD')
    .optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.enum(['dateAsc', 'dateDesc', 'createdAtDesc']).default('dateDesc'),
});

export const ListAppointmentsOutputSchema = z.object({
  items: z.array(AppointmentWithDoctorSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export const createAppointmentsService = (repo: ReturnType<typeof createAppointmentsRepo>) => ({
  getAppointmentDetail: async (userId: string, appointmentId: string, isAdmin: boolean) => {
    const appointment = await repo.getByIdWithDoctor(appointmentId);

    if (!appointment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    if (appointment.patientId !== userId && !isAdmin) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this appointment',
      });
    }

    return appointment;
  },

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

  listMyAppointments: async (
    patientId: string,
    query: z.infer<typeof ListAppointmentsInputSchema>,
  ) => {
    if (query.from && query.to && query.from > query.to) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '"from" must be before or equal to "to"',
      });
    }

    const offset = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      repo.listByPatient({
        patientId,
        status: query.status,
        from: query.from,
        to: query.to,
        offset,
        limit: query.limit,
        sort: query.sort,
      }),
      repo.countByPatient({
        patientId,
        status: query.status,
        from: query.from,
        to: query.to,
      }),
    ]);

    return { items, page: query.page, limit: query.limit, total };
  },
});
