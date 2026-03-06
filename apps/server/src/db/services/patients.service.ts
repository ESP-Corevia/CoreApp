import { z } from 'zod';

import type { createPatientsRepo, PatientUpdate } from '../repositories/patients.repository';

export const PatientProfileSchema = z.object({
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable(),
  allergies: z.string().nullable(),
  emergencyContactName: z.string().nullable(),
  emergencyContactPhone: z.string().nullable(),
});

export const UpdatePatientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
  allergies: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
});

export type UpdatePatientProfileInput = z.infer<typeof UpdatePatientProfileSchema>;

export const createPatientsService = (repo: ReturnType<typeof createPatientsRepo>) => ({
  getByUserId: (userId: string) => {
    return repo.findByUserId(userId);
  },

  upsert: (userId: string, data: PatientUpdate) => {
    return repo.upsert(userId, data);
  },
});
