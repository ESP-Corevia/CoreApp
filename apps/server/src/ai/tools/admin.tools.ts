import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './registry';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const paginationSchema = z.object({
  page: z.number().int().positive().nullish().describe('Page number (default: 1)'),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .nullish()
    .describe('Items per page (default: 10, max: 100)'),
});

const searchSchema = z.object({
  search: z.string().nullish().describe('Search by name or email'),
});

const uuidSchema = z.object({
  id: z.string().describe('The resource UUID'),
});

// -- Users ------------------------------------------------------------------

const listUsersSchema = paginationSchema.merge(searchSchema);

const listAppointmentsSchema = paginationSchema.merge(
  z.object({
    search: z.string().nullish().describe('Search in doctor/patient name'),
    status: z
      .array(z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']))
      .nullish()
      .describe('Filter by status(es)'),
    from: z.string().nullish().describe('Start date filter (YYYY-MM-DD)'),
    to: z.string().nullish().describe('End date filter (YYYY-MM-DD)'),
    doctorId: z.string().nullish().describe('Filter by doctor ID'),
    sort: z
      .enum(['dateAsc', 'dateDesc', 'createdAtDesc'])
      .nullish()
      .describe('Sort order (default: dateDesc)'),
  }),
);

const createAppointmentSchema = z.object({
  doctorId: z.string().describe('Doctor UUID'),
  patientId: z.string().describe('Patient UUID'),
  date: z.string().describe('Date (YYYY-MM-DD)'),
  time: z.string().describe('Time (HH:mm)'),
  reason: z.string().nullish().describe('Reason for the appointment'),
});

const updateAppointmentSchema = z.object({
  id: z.string().describe('Appointment UUID'),
  date: z.string().nullish().describe('New date (YYYY-MM-DD)'),
  time: z.string().nullish().describe('New time (HH:mm)'),
  reason: z.string().nullish().describe('Updated reason'),
  doctorId: z.string().nullish().describe('Reassign to doctor UUID'),
  patientId: z.string().nullish().describe('Reassign to patient UUID'),
});

const updateAppointmentStatusSchema = z.object({
  id: z.string().describe('Appointment UUID'),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).describe('New status'),
});

// -- Doctors ----------------------------------------------------------------

const listDoctorsSchema = paginationSchema.merge(
  z.object({
    search: z.string().nullish().describe('Search by name, email, specialty, or city'),
    specialty: z.string().nullish().describe('Filter by specialty'),
    city: z.string().nullish().describe('Filter by city'),
  }),
);

const createDoctorSchema = z.object({
  userId: z.string().describe('User UUID (must have doctor role)'),
  specialty: z.string().describe('Medical specialty'),
  address: z.string().describe('Office address'),
  city: z.string().describe('City'),
});

const updateDoctorSchema = z.object({
  userId: z.string().describe('Doctor user UUID'),
  specialty: z.string().nullish().describe('Updated specialty'),
  address: z.string().nullish().describe('Updated address'),
  city: z.string().nullish().describe('Updated city'),
});

// -- Patients ---------------------------------------------------------------

const listPatientsSchema = paginationSchema.merge(
  z.object({
    search: z.string().nullish().describe('Search by name or email'),
    gender: z.enum(['MALE', 'FEMALE']).nullish().describe('Filter by gender'),
  }),
);

const createPatientSchema = z.object({
  userId: z.string().describe('User UUID (must have patient role)'),
  dateOfBirth: z.string().describe('Date of birth (YYYY-MM-DD)'),
  gender: z.enum(['MALE', 'FEMALE']).describe('Gender'),
  phone: z.string().nullish().describe('Phone number'),
  address: z.string().nullish().describe('Address'),
  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .nullish()
    .describe('Blood type'),
  allergies: z.string().nullish().describe('Known allergies'),
  emergencyContactName: z.string().nullish().describe('Emergency contact name'),
  emergencyContactPhone: z.string().nullish().describe('Emergency contact phone'),
});

const updatePatientSchema = z.object({
  userId: z.string().describe('Patient user UUID'),
  dateOfBirth: z.string().nullish().describe('Updated date of birth (YYYY-MM-DD)'),
  gender: z.enum(['MALE', 'FEMALE']).nullish().describe('Updated gender'),
  phone: z.string().nullish().describe('Updated phone'),
  address: z.string().nullish().describe('Updated address'),
  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .nullish()
    .describe('Updated blood type'),
  allergies: z.string().nullish().describe('Updated allergies'),
  emergencyContactName: z.string().nullish().describe('Updated emergency contact name'),
  emergencyContactPhone: z.string().nullish().describe('Updated emergency contact phone'),
});

// -- Medications (Pillbox) --------------------------------------------------

const listMedicationsSchema = z.object({
  patientId: z.string().nullish().describe('Filter by patient UUID'),
  search: z.string().nullish().describe('Search by medication name'),
  isActive: z.boolean().nullish().describe('Filter by active status'),
  page: z.number().int().positive().nullish().describe('Page number'),
  limit: z.number().int().positive().max(50).nullish().describe('Items per page (max 50)'),
});

const patientTodayPillboxSchema = z.object({
  patientId: z.string().describe('Patient UUID'),
});

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

export function createAdminTools({ caller, auth, headers }: ToolContext) {
  return {
    // ── Queries ────────────────────────────────────────────────────────────

    list_users: tool({
      description: 'List all users with optional search and pagination.',
      inputSchema: listUsersSchema,
      execute: async args => {
        return await caller.admin.listUsers({
          page: args.page ?? 1,
          perPage: args.perPage ?? 10,
          search: args.search ?? undefined,
        });
      },
    }),

    list_appointments: tool({
      description: 'List all appointments with filters for status, date range, doctor.',
      inputSchema: listAppointmentsSchema,
      execute: async args => {
        return await caller.admin.listAppointments({
          page: args.page ?? 1,
          perPage: args.perPage ?? 10,
          search: args.search ?? undefined,
          status: args.status ?? undefined,
          from: args.from ?? undefined,
          to: args.to ?? undefined,
          doctorId: args.doctorId ?? undefined,
          sort: args.sort ?? 'dateDesc',
        });
      },
    }),

    list_doctors: tool({
      description: 'List all doctors with optional search by name, specialty, or city.',
      inputSchema: listDoctorsSchema,
      execute: async args => {
        return await caller.admin.listDoctors({
          page: args.page ?? 1,
          perPage: args.perPage ?? 10,
          search: args.search ?? undefined,
          specialty: args.specialty ?? undefined,
          city: args.city ?? undefined,
        });
      },
    }),

    list_patients: tool({
      description: 'List all patients with optional search and gender filter.',
      inputSchema: listPatientsSchema,
      execute: async args => {
        return await caller.admin.listPatients({
          page: args.page ?? 1,
          perPage: args.perPage ?? 10,
          search: args.search ?? undefined,
          gender: args.gender ?? undefined,
        });
      },
    }),

    list_medications: tool({
      description: 'List all medication prescriptions (pillbox entries) with optional filters.',
      inputSchema: listMedicationsSchema,
      execute: async args => {
        return await caller.admin.adminListPillbox({
          patientId: args.patientId ?? undefined,
          search: args.search ?? undefined,
          isActive: args.isActive ?? undefined,
          page: args.page ?? 1,
          limit: args.limit ?? 20,
        });
      },
    }),

    get_patient_today_pillbox: tool({
      description: "Get a specific patient's medication schedule for today.",
      inputSchema: patientTodayPillboxSchema,
      execute: async args => {
        return await caller.admin.adminTodayByPatient({ patientId: args.patientId });
      },
    }),

    check_user_permission: tool({
      description: 'Check if a user has a specific permission. Returns { success: true/false }.',
      inputSchema: z.object({
        userId: z.string().describe('User UUID to check'),
        permissions: z
          .record(z.string(), z.array(z.string()))
          .describe('Permission map, e.g. { "panel": ["access"] }'),
      }),
      execute: async args => {
        return await auth.api.userHasPermission({
          body: { userId: args.userId, permissions: args.permissions },
          headers,
        });
      },
    }),

    // ── Mutations (all require approval) ───────────────────────────────────

    create_appointment: tool({
      description: 'Create a new appointment for a patient with a doctor.',
      inputSchema: createAppointmentSchema,
      needsApproval: true,
      execute: async args => {
        return await caller.admin.createAppointment({
          doctorId: args.doctorId,
          patientId: args.patientId,
          date: args.date,
          time: args.time,
          reason: args.reason ?? undefined,
        });
      },
    }),

    update_appointment: tool({
      description: 'Update appointment details (date, time, reason, reassign doctor/patient).',
      inputSchema: updateAppointmentSchema,
      needsApproval: true,
      execute: async args => {
        return await caller.admin.updateAppointment({
          id: args.id,
          date: args.date ?? undefined,
          time: args.time ?? undefined,
          reason: args.reason ?? undefined,
          doctorId: args.doctorId ?? undefined,
          patientId: args.patientId ?? undefined,
        });
      },
    }),

    delete_appointment: tool({
      description: 'Permanently delete an appointment.',
      inputSchema: uuidSchema,
      needsApproval: true,
      execute: async args => {
        return await caller.admin.deleteAppointment({ id: args.id });
      },
    }),

    update_appointment_status: tool({
      description:
        'Update appointment status. Valid transitions: PENDING→CONFIRMED/CANCELLED, CONFIRMED→COMPLETED/CANCELLED, CANCELLED/COMPLETED→PENDING (reopen).',
      inputSchema: updateAppointmentStatusSchema,
      needsApproval: true,
      execute: async args => {
        return await caller.admin.updateAppointmentStatus({
          id: args.id,
          status: args.status,
        });
      },
    }),

    create_doctor: tool({
      description: 'Create a doctor profile for an existing user with doctor role.',
      inputSchema: createDoctorSchema,
      needsApproval: true,
      execute: async args => {
        return await caller.admin.createDoctor(args);
      },
    }),

    update_doctor: tool({
      description: 'Update a doctor profile (specialty, address, city).',
      inputSchema: updateDoctorSchema,
      needsApproval: true,
      execute: async args => {
        return await caller.admin.updateDoctor({
          userId: args.userId,
          specialty: args.specialty ?? undefined,
          address: args.address ?? undefined,
          city: args.city ?? undefined,
        });
      },
    }),

    create_patient: tool({
      description: 'Create a patient profile for an existing user with patient role.',
      inputSchema: createPatientSchema,
      needsApproval: true,
      execute: async args => {
        return await caller.admin.createPatient(args);
      },
    }),

    update_patient: tool({
      description: 'Update patient profile details.',
      inputSchema: updatePatientSchema,
      needsApproval: true,
      execute: async args => {
        return await caller.admin.updatePatient({
          userId: args.userId,
          dateOfBirth: args.dateOfBirth ?? undefined,
          gender: args.gender ?? undefined,
          phone: args.phone ?? undefined,
          address: args.address ?? undefined,
          bloodType: args.bloodType ?? undefined,
          allergies: args.allergies ?? undefined,
          emergencyContactName: args.emergencyContactName ?? undefined,
          emergencyContactPhone: args.emergencyContactPhone ?? undefined,
        });
      },
    }),

    delete_patient: tool({
      description: 'Permanently delete a patient profile.',
      inputSchema: z.object({ userId: z.string().describe('Patient user UUID') }),
      needsApproval: true,
      execute: async args => {
        return await caller.admin.deletePatient({ userId: args.userId });
      },
    }),

    // ── Better Auth admin API tools ────────────────────────────────────────

    update_user: tool({
      description: 'Update user fields (name, email, role, image, etc.).',
      needsApproval: true,
      inputSchema: z.object({
        userId: z.string().describe('User UUID'),
        data: z
          .record(z.string(), z.unknown())
          .describe('Fields to update, e.g. { "name": "New Name", "role": "doctor" }'),
      }),
      execute: async args => {
        return await auth.api.adminUpdateUser({
          body: { userId: args.userId, data: args.data },
          headers,
        });
      },
    }),

    ban_user: tool({
      needsApproval: true,
      description: 'Ban a user from the platform. Optionally provide a reason and expiry duration.',
      inputSchema: z.object({
        userId: z.string().describe('User UUID to ban'),
        banReason: z.string().nullish().describe('Reason for the ban'),
        banExpiresIn: z
          .number()
          .nullish()
          .describe('Ban duration in milliseconds (omit for permanent)'),
      }),
      execute: async args => {
        return await auth.api.banUser({
          body: {
            userId: args.userId,
            banReason: args.banReason ?? undefined,
            banExpiresIn: args.banExpiresIn ?? undefined,
          },
          headers,
        });
      },
    }),

    unban_user: tool({
      needsApproval: true,
      description: 'Remove the ban from a user.',
      inputSchema: z.object({
        userId: z.string().describe('User UUID to unban'),
      }),
      execute: async args => {
        return await auth.api.unbanUser({ body: { userId: args.userId }, headers });
      },
    }),

    remove_user: tool({
      description: 'Permanently delete a user account and all associated data.',
      inputSchema: z.object({
        userId: z.string().describe('User UUID to delete'),
      }),
      needsApproval: true,
      execute: async args => {
        return await auth.api.removeUser({ body: { userId: args.userId }, headers });
      },
    }),

    set_user_password: tool({
      description: "Set or reset a user's password.",
      inputSchema: z.object({
        userId: z.string().describe('User UUID'),
        newPassword: z.string().describe('The new password'),
      }),
      needsApproval: true,
      execute: async args => {
        return await auth.api.setUserPassword({
          body: { userId: args.userId, newPassword: args.newPassword },
          headers,
        });
      },
    }),
  };
}
