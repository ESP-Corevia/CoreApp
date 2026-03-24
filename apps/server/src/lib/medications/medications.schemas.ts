import { z } from 'zod';

// ─── Medications Search ─────────────────────────────────────

export const SearchMedicationsInputSchema = z.object({
  query: z.string().min(3).max(50),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const MedicationItemSchema = z.object({
  externalId: z.string().nullable(),
  cis: z.string().nullable(),
  cip: z.string().nullable(),
  name: z.string(),
  shortLabel: z.string(),
  form: z.string().nullable(),
  route: z.string().nullable(),
  status: z.string().nullable(),
  marketingStatus: z.string().nullable(),
  reimbursementRate: z.string().nullable(),
  price: z.string().nullable(),
  laboratory: z.string().nullable(),
  activeSubstances: z.array(z.string()),
  normalizedForm: z.string(),
  iconKey: z.string(),
  source: z.literal('api-medicaments-fr'),
});

export const SearchMedicationsOutputSchema = z.object({
  items: z.array(MedicationItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const GetByCodeInputSchema = z
  .object({
    cis: z.string().optional(),
    cip: z.string().optional(),
    externalId: z.string().optional(),
  })
  .refine(data => data.cis || data.cip || data.externalId, {
    message: 'At least one of cis, cip, or externalId must be provided',
  });

export const GetByCodeOutputSchema = MedicationItemSchema.nullable();

// ─── Pillbox - Patient Medications ──────────────────────────

export const CreatePatientMedicationInputSchema = z.object({
  medicationExternalId: z.string().nullable().optional(),
  source: z.string().default('api-medicaments-fr'),
  cis: z.string().nullable().optional(),
  cip: z.string().nullable().optional(),
  medicationName: z.string().min(1).max(500),
  medicationForm: z.string().nullable().optional(),
  activeSubstances: z.array(z.string()).nullable().optional(),
  dosageLabel: z.string().nullable().optional(),
  instructions: z.string().max(2000).nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .nullable()
    .optional(),
  schedules: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6).nullable().optional(),
        intakeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm'),
        intakeMoment: z.enum(['MORNING', 'NOON', 'EVENING', 'BEDTIME', 'CUSTOM']).default('CUSTOM'),
        quantity: z.string().default('1'),
        unit: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .min(1, 'At least one schedule is required'),
});

export const UpdatePatientMedicationInputSchema = z.object({
  id: z.uuid(),
  dosageLabel: z.string().nullable().optional(),
  instructions: z.string().max(2000).nullable().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const PatientMedicationOutputSchema = z.object({
  id: z.uuid(),
  patientId: z.uuid(),
  medicationExternalId: z.string().nullable(),
  source: z.string(),
  cis: z.string().nullable(),
  cip: z.string().nullable(),
  medicationName: z.string(),
  medicationForm: z.string().nullable(),
  activeSubstances: z.unknown().nullable(),
  dosageLabel: z.string().nullable(),
  instructions: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

export const PatientMedicationDetailOutputSchema = PatientMedicationOutputSchema.extend({
  schedules: z.array(
    z.object({
      id: z.uuid(),
      weekday: z.number().nullable(),
      intakeTime: z.string(),
      intakeMoment: z.string(),
      quantity: z.string(),
      unit: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ),
});

const coerceBoolean = z
  .union([z.boolean(), z.string()])
  .transform(val => (typeof val === 'string' ? val === 'true' : val))
  .optional();

export const ListPillboxInputSchema = z.object({
  isActive: coerceBoolean,
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const ListPillboxOutputSchema = z.object({
  items: z.array(PatientMedicationOutputSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

// ─── Schedules ──────────────────────────────────────────────

export const AddScheduleInputSchema = z.object({
  patientMedicationId: z.uuid(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  intakeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  intakeMoment: z.enum(['MORNING', 'NOON', 'EVENING', 'BEDTIME', 'CUSTOM']).default('CUSTOM'),
  quantity: z.string().default('1'),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const UpdateScheduleInputSchema = z.object({
  id: z.uuid(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  intakeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  intakeMoment: z.enum(['MORNING', 'NOON', 'EVENING', 'BEDTIME', 'CUSTOM']).optional(),
  quantity: z.string().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const DeleteScheduleInputSchema = z.object({
  id: z.uuid(),
});

export const ScheduleOutputSchema = z.object({
  id: z.uuid(),
  patientMedicationId: z.uuid(),
  weekday: z.number().nullable(),
  intakeTime: z.string(),
  intakeMoment: z.string(),
  quantity: z.string(),
  unit: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// ─── Intakes ────────────────────────────────────────────────

export const TodayPillboxOutputSchema = z.object({
  date: z.string(),
  intakes: z.array(
    z.object({
      id: z.uuid(),
      patientMedicationId: z.uuid(),
      scheduleId: z.uuid().nullable(),
      medicationName: z.string(),
      medicationForm: z.string().nullable(),
      dosageLabel: z.string().nullable(),
      scheduledTime: z.string(),
      intakeMoment: z.string().nullable(),
      quantity: z.string().nullable(),
      unit: z.string().nullable(),
      status: z.string(),
      takenAt: z.coerce.date().nullable(),
      notes: z.string().nullable(),
    }),
  ),
});

export const MarkIntakeInputSchema = z.object({
  id: z.uuid(),
  notes: z.string().max(500).nullable().optional(),
});

export const IntakeOutputSchema = z.object({
  id: z.uuid(),
  patientMedicationId: z.uuid(),
  scheduleId: z.uuid().nullable(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  status: z.string(),
  takenAt: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
});

// ─── Admin Pillbox ──────────────────────────────────────────

export const AdminListPillboxInputSchema = z.object({
  patientId: z.uuid().optional(),
  search: z.string().max(100).optional(),
  isActive: coerceBoolean,
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const AdminPillboxItemSchema = PatientMedicationOutputSchema.extend({
  patientName: z.string().nullable(),
  patientEmail: z.string().nullable(),
});

export const AdminListPillboxOutputSchema = z.object({
  items: z.array(AdminPillboxItemSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export const AdminCreateMedicationInputSchema = CreatePatientMedicationInputSchema.extend({
  patientId: z.uuid(),
});

export const AdminTodayInputSchema = z.object({
  patientId: z.uuid(),
});
