import { z } from 'zod';

import { AvailableSlotsOutputSchema } from '../db/services/availability.service';
import { DoctorsListOutputSchema } from '../db/services/doctors.service';
import { patientProcedure, router } from '../middlewares';

const DoctorsListInputSchema = z.object({
  specialty: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

const AvailableSlotsInputSchema = z.object({
  doctorId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

export const doctorsRouter = router({
  list: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctors',
        summary: 'List bookable doctors',
        description:
          'Returns a paginated list of bookable doctors with optional filters on specialty, city, and free-text search.',
        tags: ['Doctors'],
      },
    })
    .input(DoctorsListInputSchema)
    .output(DoctorsListOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.doctorsService.listBookable({
        specialty: input.specialty,
        city: input.city,
        search: input.search,
        page: input.page,
        limit: input.limit,
      });
    }),

  availableSlots: patientProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/doctors/{doctorId}/available-slots',
        summary: 'Get available slots for a doctor on a given date',
        description:
          'Returns the list of available 30-minute appointment slots for a doctor on a specific date (Europe/Paris timezone). Excludes reserved and blocked slots.',
        tags: ['Appointments'],
      },
    })
    .input(AvailableSlotsInputSchema)
    .output(AvailableSlotsOutputSchema)
    .query(async ({ input, ctx: { services } }) => {
      return await services.availabilityService.getAvailableSlots(input.doctorId, input.date);
    }),
});
