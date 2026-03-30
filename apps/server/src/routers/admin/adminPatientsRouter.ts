import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure } from '../../middlewares';
import { MAX_ADMIN_PER_PAGE } from './constants';

const genderEnum = z.enum(['MALE', 'FEMALE']);
const bloodTypeEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

const patientOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dateOfBirth: z.string(),
  gender: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  bloodType: z.string().nullable(),
  allergies: z.string().nullable(),
  emergencyContactName: z.string().nullable(),
  emergencyContactPhone: z.string().nullable(),
});

export const listPatients = adminProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/admin/patients',
      summary: 'List all patients',
      description: 'Returns a paginated list of all patients with user and medical info.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      page: z.number().int().positive(),
      perPage: z.number().int().positive().max(MAX_ADMIN_PER_PAGE),
      search: z.string().optional(),
      gender: genderEnum.optional(),
    }),
  )
  .output(
    z.object({
      patients: z.array(
        z.object({
          userId: z.string(),
          name: z.string(),
          email: z.string(),
          emailVerified: z.boolean(),
          image: z.string().nullable(),
          role: z.string().nullable(),
          banned: z.boolean(),
          createdAt: z.coerce.date(),
          updatedAt: z.coerce.date().nullable(),
          patientId: z.string(),
          dateOfBirth: z.string(),
          gender: z.string(),
          phone: z.string().nullable(),
          patientAddress: z.string().nullable(),
          bloodType: z.string().nullable(),
          allergies: z.string().nullable(),
          emergencyContactName: z.string().nullable(),
          emergencyContactPhone: z.string().nullable(),
        }),
      ),
      totalItems: z.number().int(),
      totalPages: z.number().int(),
      page: z.number().int(),
      perPage: z.number().int(),
    }),
  )
  .query(async ({ input, ctx }) => {
    return await ctx.services.patientsService.listAllAdmin({
      page: input.page,
      perPage: input.perPage,
      search: input.search,
      gender: input.gender,
    });
  });

export const createPatient = adminProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/admin/patients',
      summary: 'Create a patient profile',
      description: 'Admin creates a patient profile for an existing user with role "patient".',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      userId: z.uuid(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
      gender: genderEnum,
      phone: z.string().nullable().default(null),
      address: z.string().nullable().default(null),
      bloodType: bloodTypeEnum.nullable().default(null),
      allergies: z.string().nullable().default(null),
      emergencyContactName: z.string().nullable().default(null),
      emergencyContactPhone: z.string().nullable().default(null),
    }),
  )
  .output(patientOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { userId, ...data } = input;
    return await ctx.services.patientsService.createProfile(userId, data);
  });

export const updatePatient = adminProcedure
  .meta({
    openapi: {
      method: 'PUT',
      path: '/admin/patients/{userId}',
      summary: 'Update a patient profile',
      description: 'Admin updates a patient profile.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(
    z.object({
      userId: z.uuid(),
      dateOfBirth: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
        .optional(),
      gender: genderEnum.optional(),
      phone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      bloodType: bloodTypeEnum.nullable().optional(),
      allergies: z.string().nullable().optional(),
      emergencyContactName: z.string().nullable().optional(),
      emergencyContactPhone: z.string().nullable().optional(),
    }),
  )
  .output(patientOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { userId, ...data } = input;
    try {
      const updated = await ctx.services.patientsService.updateProfile(userId, data);
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
      }
      return updated;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update patient profile',
        cause: error,
      });
    }
  });

export const deletePatient = adminProcedure
  .meta({
    openapi: {
      method: 'DELETE',
      path: '/admin/patients/{userId}',
      summary: 'Delete a patient profile',
      description: 'Admin deletes a patient profile.',
      protect: true,
      tags: ['AdminRouter'],
    },
  })
  .input(z.object({ userId: z.uuid() }))
  .output(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    return await ctx.services.patientsService.deleteProfile(input.userId);
  });
