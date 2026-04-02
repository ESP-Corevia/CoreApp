import { toolDefinition } from '@tanstack/ai';
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
  // ── Queries ──────────────────────────────────────────────────────────────

  const listUsers = toolDefinition({
    name: 'list_users',
    description: 'List all users with optional search and pagination.',
    inputSchema: listUsersSchema,
  }).server(async args => {
    const input = args as z.infer<typeof listUsersSchema>;
    return await caller.admin.listUsers({
      page: input.page ?? 1,
      perPage: input.perPage ?? 10,
      search: input.search ?? undefined,
    });
  });

  const listAppointments = toolDefinition({
    name: 'list_appointments',
    description: 'List all appointments with filters for status, date range, doctor.',
    inputSchema: listAppointmentsSchema,
  }).server(async args => {
    const input = args as z.infer<typeof listAppointmentsSchema>;
    return await caller.admin.listAppointments({
      page: input.page ?? 1,
      perPage: input.perPage ?? 10,
      search: input.search ?? undefined,
      status: input.status ?? undefined,
      from: input.from ?? undefined,
      to: input.to ?? undefined,
      doctorId: input.doctorId ?? undefined,
      sort: input.sort ?? 'dateDesc',
    });
  });

  const listDoctors = toolDefinition({
    name: 'list_doctors',
    description: 'List all doctors with optional search by name, specialty, or city.',
    inputSchema: listDoctorsSchema,
  }).server(async args => {
    const input = args as z.infer<typeof listDoctorsSchema>;
    return await caller.admin.listDoctors({
      page: input.page ?? 1,
      perPage: input.perPage ?? 10,
      search: input.search ?? undefined,
      specialty: input.specialty ?? undefined,
      city: input.city ?? undefined,
    });
  });

  const listPatients = toolDefinition({
    name: 'list_patients',
    description: 'List all patients with optional search and gender filter.',
    inputSchema: listPatientsSchema,
  }).server(async args => {
    const input = args as z.infer<typeof listPatientsSchema>;
    return await caller.admin.listPatients({
      page: input.page ?? 1,
      perPage: input.perPage ?? 10,
      search: input.search ?? undefined,
      gender: input.gender ?? undefined,
    });
  });

  const listMedications = toolDefinition({
    name: 'list_medications',
    description: 'List all medication prescriptions (pillbox entries) with optional filters.',
    inputSchema: listMedicationsSchema,
  }).server(async args => {
    const input = args as z.infer<typeof listMedicationsSchema>;
    return await caller.admin.adminListPillbox({
      patientId: input.patientId ?? undefined,
      search: input.search ?? undefined,
      isActive: input.isActive ?? undefined,
      page: input.page ?? 1,
      limit: input.limit ?? 20,
    });
  });

  const getPatientTodayPillbox = toolDefinition({
    name: 'get_patient_today_pillbox',
    description: "Get a specific patient's medication schedule for today.",
    inputSchema: patientTodayPillboxSchema,
  }).server(async args => {
    const input = args as z.infer<typeof patientTodayPillboxSchema>;
    return await caller.admin.adminTodayByPatient({ patientId: input.patientId });
  });

  // ── Mutations (all require approval) ─────────────────────────────────────

  const createAppointment = toolDefinition({
    name: 'create_appointment',
    description: 'Create a new appointment for a patient with a doctor.',
    inputSchema: createAppointmentSchema,
  }).server(async args => {
    const input = args as z.infer<typeof createAppointmentSchema>;
    return await caller.admin.createAppointment({
      doctorId: input.doctorId,
      patientId: input.patientId,
      date: input.date,
      time: input.time,
      reason: input.reason ?? undefined,
    });
  });

  const updateAppointment = toolDefinition({
    name: 'update_appointment',
    description: 'Update appointment details (date, time, reason, reassign doctor/patient).',
    inputSchema: updateAppointmentSchema,
  }).server(async args => {
    const input = args as z.infer<typeof updateAppointmentSchema>;
    return await caller.admin.updateAppointment({
      id: input.id,
      date: input.date ?? undefined,
      time: input.time ?? undefined,
      reason: input.reason ?? undefined,
      doctorId: input.doctorId ?? undefined,
      patientId: input.patientId ?? undefined,
    });
  });

  const deleteAppointment = toolDefinition({
    name: 'delete_appointment',
    description: 'Permanently delete an appointment.',
    inputSchema: uuidSchema,
  }).server(async args => {
    const input = args as z.infer<typeof uuidSchema>;
    return await caller.admin.deleteAppointment({ id: input.id });
  });

  const updateAppointmentStatus = toolDefinition({
    name: 'update_appointment_status',
    description:
      'Update appointment status. Valid transitions: PENDING→CONFIRMED/CANCELLED, CONFIRMED→COMPLETED/CANCELLED, CANCELLED/COMPLETED→PENDING (reopen).',
    inputSchema: updateAppointmentStatusSchema,
  }).server(async args => {
    const input = args as z.infer<typeof updateAppointmentStatusSchema>;
    return await caller.admin.updateAppointmentStatus({
      id: input.id,
      status: input.status,
    });
  });

  const createDoctor = toolDefinition({
    name: 'create_doctor',
    description: 'Create a doctor profile for an existing user with doctor role.',
    inputSchema: createDoctorSchema,
  }).server(async args => {
    const input = args as z.infer<typeof createDoctorSchema>;
    return await caller.admin.createDoctor(input);
  });

  const updateDoctor = toolDefinition({
    name: 'update_doctor',
    description: 'Update a doctor profile (specialty, address, city).',
    inputSchema: updateDoctorSchema,
  }).server(async args => {
    const input = args as z.infer<typeof updateDoctorSchema>;
    return await caller.admin.updateDoctor({
      userId: input.userId,
      specialty: input.specialty ?? undefined,
      address: input.address ?? undefined,
      city: input.city ?? undefined,
    });
  });

  const createPatient = toolDefinition({
    name: 'create_patient',
    description: 'Create a patient profile for an existing user with patient role.',
    inputSchema: createPatientSchema,
  }).server(async args => {
    const input = args as z.infer<typeof createPatientSchema>;
    return await caller.admin.createPatient(input);
  });

  const updatePatient = toolDefinition({
    name: 'update_patient',
    description: 'Update patient profile details.',
    inputSchema: updatePatientSchema,
  }).server(async args => {
    const input = args as z.infer<typeof updatePatientSchema>;
    return await caller.admin.updatePatient({
      userId: input.userId,
      dateOfBirth: input.dateOfBirth ?? undefined,
      gender: input.gender ?? undefined,
      phone: input.phone ?? undefined,
      address: input.address ?? undefined,
      bloodType: input.bloodType ?? undefined,
      allergies: input.allergies ?? undefined,
      emergencyContactName: input.emergencyContactName ?? undefined,
      emergencyContactPhone: input.emergencyContactPhone ?? undefined,
    });
  });

  const deletePatient = toolDefinition({
    name: 'delete_patient',
    description: 'Permanently delete a patient profile.',
    inputSchema: z.object({ userId: z.string().describe('Patient user UUID') }),
  }).server(async args => {
    const input = args as { userId: string };
    return await caller.admin.deletePatient({ userId: input.userId });
  });

  // ── Better Auth admin API tools (all require approval) ────────────────

  const updateUser = toolDefinition({
    name: 'update_user',
    description: 'Update user fields (name, email, role, image, etc.).',
    inputSchema: z.object({
      userId: z.string().describe('User UUID'),
      data: z
        .record(z.string(), z.unknown())
        .describe('Fields to update, e.g. { "name": "New Name", "role": "doctor" }'),
    }),
  }).server(async args => {
    const input = args as { userId: string; data: Record<string, unknown> };
    return await auth.api.adminUpdateUser({
      body: { userId: input.userId, data: input.data },
      headers,
    });
  });

  const banUser = toolDefinition({
    name: 'ban_user',
    description: 'Ban a user from the platform. Optionally provide a reason and expiry duration.',
    inputSchema: z.object({
      userId: z.string().describe('User UUID to ban'),
      banReason: z.string().nullish().describe('Reason for the ban'),
      banExpiresIn: z
        .number()
        .nullish()
        .describe('Ban duration in milliseconds (omit for permanent)'),
    }),
  }).server(async args => {
    const input = args as { userId: string; banReason?: string; banExpiresIn?: number };
    return await auth.api.banUser({
      body: {
        userId: input.userId,
        banReason: input.banReason,
        banExpiresIn: input.banExpiresIn,
      },
      headers,
    });
  });

  const unbanUser = toolDefinition({
    name: 'unban_user',
    description: 'Remove the ban from a user.',
    inputSchema: z.object({
      userId: z.string().describe('User UUID to unban'),
    }),
  }).server(async args => {
    const input = args as { userId: string };
    return await auth.api.unbanUser({ body: { userId: input.userId }, headers });
  });

  const removeUser = toolDefinition({
    name: 'remove_user',
    description: 'Permanently delete a user account and all associated data.',
    inputSchema: z.object({
      userId: z.string().describe('User UUID to delete'),
    }),
  }).server(async args => {
    const input = args as { userId: string };
    return await auth.api.removeUser({ body: { userId: input.userId }, headers });
  });

  const setUserPassword = toolDefinition({
    name: 'set_user_password',
    description: "Set or reset a user's password.",
    inputSchema: z.object({
      userId: z.string().describe('User UUID'),
      newPassword: z.string().describe('The new password'),
    }),
  }).server(async args => {
    const input = args as { userId: string; newPassword: string };
    return await auth.api.setUserPassword({
      body: { userId: input.userId, newPassword: input.newPassword },
      headers,
    });
  });

  const checkUserPermission = toolDefinition({
    name: 'check_user_permission',
    description: 'Check if a user has a specific permission. Returns { success: true/false }.',
    inputSchema: z.object({
      userId: z.string().describe('User UUID to check'),
      permissions: z
        .record(z.string(), z.array(z.string()))
        .describe('Permission map, e.g. { "panel": ["access"] }'),
    }),
  }).server(async args => {
    const input = args as { userId: string; permissions: Record<string, string[]> };
    return await auth.api.userHasPermission({
      body: { userId: input.userId, permissions: input.permissions },
      headers,
    });
  });

  return [
    // Queries
    listUsers,
    listAppointments,
    listDoctors,
    listPatients,
    listMedications,
    getPatientTodayPillbox,
    checkUserPermission,
    // Mutations (all need approval)
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    createDoctor,
    updateDoctor,
    createPatient,
    updatePatient,
    deletePatient,
    updateUser,
    banUser,
    unbanUser,
    removeUser,
    setUserPassword,
  ];
}
