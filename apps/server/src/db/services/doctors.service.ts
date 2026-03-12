import { z } from 'zod';

import type { createDoctorsRepo } from '../repositories/doctors.repository';

export const DoctorProfileSchema = z.object({
  specialty: z.string(),
  address: z.string(),
  city: z.string(),
});

export const DoctorOutputSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  specialty: z.string(),
  address: z.string(),
  city: z.string(),
  name: z.string().nullable(),
});

export const DoctorsListOutputSchema = z.object({
  items: z.array(DoctorOutputSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});

export const UpdateDoctorProfileSchema = z.object({
  specialty: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

export type UpdateDoctorProfileInput = z.infer<typeof UpdateDoctorProfileSchema>;

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

  getByUserId: (userId: string) => {
    return repo.getByUserId(userId);
  },

  updateProfile: async (userId: string, data: UpdateDoctorProfileInput) => {
    const doctor = await repo.getByUserId(userId);
    if (!doctor) {
      throw new Error('Doctor profile not found');
    }
    return repo.updateByUserId(userId, data);
  },

  listAllAdmin: async (query: {
    page: number;
    perPage: number;
    search?: string;
    specialty?: string;
    city?: string;
  }) => {
    const offset = (query.page - 1) * query.perPage;

    const [items, total] = await Promise.all([
      repo.listAllAdmin({
        search: query.search,
        specialty: query.specialty,
        city: query.city,
        offset,
        limit: query.perPage,
      }),
      repo.countAllAdmin({
        search: query.search,
        specialty: query.specialty,
        city: query.city,
      }),
    ]);

    const totalPages = Math.ceil(total / query.perPage);

    return {
      doctors: items,
      totalItems: total,
      totalPages,
      page: query.page,
      perPage: query.perPage,
    };
  },
});
