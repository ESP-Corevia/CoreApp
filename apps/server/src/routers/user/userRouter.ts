import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { DoctorProfileSchema, UpdateDoctorProfileSchema } from '../../db/services/doctors.service';
import {
  PatientProfileSchema,
  UpdatePatientProfileSchema,
} from '../../db/services/patients.service';
import { UserOutputSchema } from '../../db/services/users.service';
import { protectedProcedure, router } from '../../middlewares';

const ALLOWED_INITIAL_ROLES = ['patient', 'doctor'] as const;

const GetMeOutputSchema = UserOutputSchema.extend({
  doctorProfile: DoctorProfileSchema.nullable(),
  patientProfile: PatientProfileSchema.nullable(),
});

const UpdateProfileInputSchema = z.object({
  name: z.string().min(1).optional(),
  doctorProfile: UpdateDoctorProfileSchema.optional(),
  patientProfile: UpdatePatientProfileSchema.optional(),
});

export const userRouter = router({
  setInitialRole: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/me/initial-role',
        summary: 'Set initial role after sign-up',
        description:
          'Allows a newly created user to set their role to patient or doctor. Only works if the current role is the default (patient). Cannot set admin.',
        protect: true,
        tags: ['UserRouter'],
      },
    })
    .input(z.object({ role: z.enum(ALLOWED_INITIAL_ROLES) }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx: { auth, session }, input }) => {
      const user = await auth.api.getUser({ query: { userId: session.userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      // Only allow changing from the default role (patient)
      if ((user as Record<string, unknown>).role !== 'patient') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Role has already been set',
        });
      }
      await auth.api.adminUpdateUser({
        body: { userId: session.userId, data: { role: input.role } },
      });
      return { success: true };
    }),

  getMe: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/me',
        summary: 'Get current user',
        description: 'Returns the current user information, including role-specific profile.',
        protect: true,
        tags: ['UserRouter'],
      },
    })
    .input(z.object({}))
    .output(z.object({ user: GetMeOutputSchema }))
    .query(async ({ ctx: { services, session } }) => {
      const user = await services.usersService.getMe(session.userId);

      let doctorProfile = null;
      let patientProfile = null;

      if (user.role === 'doctor') {
        doctorProfile = await services.doctorsService.getByUserId(session.userId);
      } else if (user.role === 'patient') {
        patientProfile = await services.patientsService.getByUserId(session.userId);
      }

      return { user: { ...user, doctorProfile, patientProfile } };
    }),

  updateProfile: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/me',
        summary: 'Update current user profile',
        description:
          'Updates base info for all roles. Doctor/patient-specific fields are applied only when the caller has the matching role.',
        protect: true,
        tags: ['UserRouter'],
      },
    })
    .input(UpdateProfileInputSchema)
    .output(z.object({ user: GetMeOutputSchema }))
    .mutation(async ({ ctx: { services, session }, input }) => {
      const user = await services.usersService.getMe(session.userId);

      if (input.name !== undefined) {
        await services.usersService.updateMe(session.userId, {
          ...(input.name !== undefined && { name: input.name }),
        });
      }

      let doctorProfile = null;
      let patientProfile = null;

      if (user.role === 'doctor') {
        if (input.doctorProfile && Object.keys(input.doctorProfile).length > 0) {
          doctorProfile = await services.doctorsService.updateProfile(
            session.userId,
            input.doctorProfile,
          );
        } else {
          doctorProfile = await services.doctorsService.getByUserId(session.userId);
        }
      } else if (user.role === 'patient') {
        if (input.patientProfile && Object.keys(input.patientProfile).length > 0) {
          patientProfile = await services.patientsService.upsert(
            session.userId,
            input.patientProfile as Parameters<typeof services.patientsService.upsert>[1],
          );
        } else {
          patientProfile = await services.patientsService.getByUserId(session.userId);
        }
      } else if (user.role === 'admin') {
        if (input.doctorProfile || input.patientProfile) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Admins cannot update doctor or patient profiles via this endpoint.',
          });
        }
      }

      const updatedUser = await services.usersService.getMe(session.userId);
      return { user: { ...updatedUser, doctorProfile, patientProfile } };
    }),
});
