import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import type { createPatientsRepo, PatientUpdate } from '../repositories/patients.repository';
import type { createUsersRepo } from '../repositories/users.repository';

export const PatientProfileSchema = z.object({
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable(),
  allergies: z.string().nullable(),
  emergencyContactName: z.string().nullable(),
  emergencyContactPhone: z.string().nullable(),
});

export const UpdatePatientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
  allergies: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
});

export type UpdatePatientProfileInput = z.infer<typeof UpdatePatientProfileSchema>;

export const createPatientsService = (
  repo: ReturnType<typeof createPatientsRepo>,
  usersRepo: ReturnType<typeof createUsersRepo>,
) => ({
  getByUserId: (userId: string) => {
    return repo.findByUserId(userId);
  },

  upsert: (userId: string, data: PatientUpdate) => {
    return repo.upsert(userId, data);
  },

  /**
   * Crée un profil patient pour un utilisateur existant.
   * Vérifie que l'utilisateur existe et qu'il a le rôle "patient".
   * @throws NOT_FOUND si l'utilisateur n'existe pas.
   * @throws BAD_REQUEST si l'utilisateur n'a pas le rôle "patient".
   * @throws CONFLICT si l'utilisateur a déjà un profil patient.
   */
  createProfile: async (userId: string, data: PatientUpdate) => {
    const user = await usersRepo.findById({ id: userId });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }
    if (user.role !== 'patient') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `User role is "${user.role ?? 'none'}", expected "patient"`,
      });
    }
    const existing = await repo.findByUserId(userId);
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Patient profile already exists' });
    }
    return repo.createByUserId(userId, data);
  },

  /**
   * Met à jour le profil patient. Vérifie que le profil existe avant la mise à jour.
   * @throws Error si le profil patient n'existe pas.
   */
  updateProfile: async (userId: string, data: Partial<PatientUpdate>) => {
    const patient = await repo.findByUserId(userId);
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
    }
    return repo.updateByUserId(userId, data);
  },

  /**
   * Supprime le profil patient.
   * @throws NOT_FOUND si le profil patient n'existe pas.
   */
  deleteProfile: async (userId: string) => {
    const patient = await repo.findByUserId(userId);
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
    }
    return repo.deleteByUserId(userId);
  },

  /**
   * Liste tous les patients (vue admin) avec pagination.
   * Filtrable par recherche textuelle (nom, email) et genre.
   */
  listAllAdmin: async (query: {
    page: number;
    perPage: number;
    search?: string;
    gender?: string;
  }) => {
    const offset = (query.page - 1) * query.perPage;

    const [items, total] = await Promise.all([
      repo.listAllAdmin({
        search: query.search,
        gender: query.gender,
        offset,
        limit: query.perPage,
      }),
      repo.countAllAdmin({
        search: query.search,
        gender: query.gender,
      }),
    ]);

    const totalPages = Math.ceil(total / query.perPage);

    return {
      patients: items,
      totalItems: total,
      totalPages,
      page: query.page,
      perPage: query.perPage,
    };
  },
});
