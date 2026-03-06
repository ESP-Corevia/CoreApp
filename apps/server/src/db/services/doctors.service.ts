import { z } from 'zod';

import type { createDoctorsRepo } from '../repositories/doctors.repository';

export const DoctorOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.string(),
  address: z.string(),
  city: z.string(),
  imageUrl: z.string().nullable(),
});

export const DoctorsListOutputSchema = z.object({
  items: z.array(DoctorOutputSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});

export interface ListBookableQuery {
  specialty?: string;
  city?: string;
  search?: string;
  page: number;
  limit: number;
}

export const createDoctorsService = (repo: ReturnType<typeof createDoctorsRepo>) => ({
  listBookable: async (query: ListBookableQuery) => {
    const { page, limit, ...filters } = query;
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      repo.listBookable({ ...filters, offset, limit }),
      repo.countBookable(filters),
    ]);

    return { items, page, limit, total };
  },
});
