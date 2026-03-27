import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { createAppointmentsRepo } from '../repositories/appointments.repository';
import { BASE_SLOTS } from './availability.service';

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
  name: z.string().nullable(),
  specialty: z.string(),
  address: z.string(),
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
  /**
   * Récupère le détail d'un rendez-vous avec les infos du médecin.
   * Vérifie que l'utilisateur est le patient concerné ou un admin.
   * @throws NOT_FOUND si le rendez-vous n'existe pas.
   * @throws FORBIDDEN si l'utilisateur n'est ni le patient ni un admin.
   */
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

  /**
   * Crée un rendez-vous pour un patient.
   * Valide le créneau (slot de 30 min, pas dans le passé) puis délègue la création atomique au repo.
   * @throws UNPROCESSABLE_CONTENT si le créneau est invalide ou dans le passé.
   * @throws CONFLICT si le créneau est déjà pris ou bloqué par le médecin.
   */
  createAppointment: async (
    patientId: string,
    input: z.infer<typeof CreateAppointmentInputSchema>,
  ) => {
    // Validate slot is a valid base slot
    if (!BASE_SLOTS.includes(input.time)) {
      throw new TRPCError({
        code: 'UNPROCESSABLE_CONTENT',
        message: `Invalid time slot: ${input.time}. Allowed appointment slots are every 30 minutes from 08:00 to 17:30, excluding the break from 12:00 to 13:00.`,
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

  /**
   * Liste les rendez-vous du patient connecté avec pagination.
   * Supporte le filtrage par statut et plage de dates.
   * @throws BAD_REQUEST si `from` est postérieur à `to`.
   */
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

  /**
   * Liste tous les rendez-vous (vue admin) avec pagination.
   * Supporte le filtrage par statut, plage de dates, médecin et recherche textuelle.
   */
  listAllAppointments: async (query: {
    page: number;
    perPage: number;
    search?: string;
    status?: string;
    from?: string;
    to?: string;
    doctorId?: string;
    sort?: 'dateAsc' | 'dateDesc' | 'createdAtDesc';
  }) => {
    const offset = (query.page - 1) * query.perPage;

    const [items, total] = await Promise.all([
      repo.listAll({
        status: query.status,
        from: query.from,
        to: query.to,
        doctorId: query.doctorId,
        search: query.search,
        offset,
        limit: query.perPage,
        sort: query.sort ?? 'dateDesc',
      }),
      repo.countAll({
        status: query.status,
        from: query.from,
        to: query.to,
        doctorId: query.doctorId,
        search: query.search,
      }),
    ]);

    const totalPages = Math.ceil(total / query.perPage);

    return {
      appointments: items,
      totalItems: total,
      totalPages,
      page: query.page,
      perPage: query.perPage,
    };
  },

  /**
   * Crée un rendez-vous en tant qu'admin (pas de vérification de date passée).
   * Valide le créneau puis délègue la création atomique au repo.
   * @throws UNPROCESSABLE_CONTENT si le créneau est invalide.
   * @throws CONFLICT si le créneau est déjà pris ou bloqué.
   */
  adminCreateAppointment: async (
    input: z.infer<typeof CreateAppointmentInputSchema> & { patientId: string },
  ) => {
    if (!BASE_SLOTS.includes(input.time)) {
      throw new TRPCError({
        code: 'UNPROCESSABLE_CONTENT',
        message: `Invalid time slot: ${input.time}. Allowed appointment slots are every 30 minutes from 08:00 to 17:30, excluding the break from 12:00 to 13:00.`,
      });
    }

    const result = await repo.createAppointmentAtomic({
      doctorId: input.doctorId,
      patientId: input.patientId,
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

  /**
   * Met à jour un rendez-vous en tant qu'admin (date, heure, motif, médecin, patient).
   * @throws NOT_FOUND si le rendez-vous n'existe pas.
   * @throws UNPROCESSABLE_CONTENT si le nouveau créneau est invalide.
   */
  adminUpdateAppointment: async (
    appointmentId: string,
    input: { date?: string; time?: string; reason?: string; doctorId?: string; patientId?: string },
  ) => {
    const appointment = await repo.getByIdWithDoctor(appointmentId);

    if (!appointment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    if (input.time && !BASE_SLOTS.includes(input.time)) {
      throw new TRPCError({
        code: 'UNPROCESSABLE_CONTENT',
        message: `Invalid time slot: ${input.time}. Allowed appointment slots are every 30 minutes from 08:00 to 17:30, excluding the break from 12:00 to 13:00.`,
      });
    }

    const updated = await repo.update(appointmentId, input);

    if (!updated) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update appointment',
      });
    }

    return updated;
  },

  /**
   * Supprime un rendez-vous en tant qu'admin.
   * @throws NOT_FOUND si le rendez-vous n'existe pas.
   */
  adminDeleteAppointment: async (appointmentId: string) => {
    const appointment = await repo.getByIdWithDoctor(appointmentId);

    if (!appointment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    const deleted = await repo.deleteById(appointmentId);

    if (!deleted) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete appointment',
      });
    }

    return deleted;
  },

  /**
   * Change le statut d'un rendez-vous en respectant les transitions autorisées :
   * PENDING → CONFIRMED | CANCELLED, CONFIRMED → COMPLETED | CANCELLED.
   * @throws NOT_FOUND si le rendez-vous n'existe pas.
   * @throws BAD_REQUEST si la transition de statut est invalide.
   */
  updateAppointmentStatus: async (appointmentId: string, newStatus: string) => {
    const appointment = await repo.getByIdWithDoctor(appointmentId);

    if (!appointment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    const currentStatus = appointment.status;

    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      CANCELLED: [],
      COMPLETED: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      });
    }

    const updated = await repo.updateStatus(appointmentId, newStatus);

    if (!updated) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update appointment status',
      });
    }

    return updated;
  },
});
