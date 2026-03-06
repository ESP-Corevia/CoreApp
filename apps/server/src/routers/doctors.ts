import { z } from 'zod';

import { DoctorsListOutputSchema } from '../db/services/doctors.service';
import { publicProcedure, router } from '../middlewares';

const DoctorsListInputSchema = z.object({
  specialty: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const doctorsRouter = router({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/api/doctors',
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
});
