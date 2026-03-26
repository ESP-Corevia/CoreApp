import { relations } from 'drizzle-orm';
import { foreignKey, index, pgEnum, pgTable, unique } from 'drizzle-orm/pg-core';

import { users } from './auth';

export const intakeMomentEnum = pgEnum('intake_moment', [
  'MORNING',
  'NOON',
  'EVENING',
  'BEDTIME',
  'CUSTOM',
]);

export const intakeStatusEnum = pgEnum('intake_status', ['PENDING', 'TAKEN', 'SKIPPED']);

export const patientMedications = pgTable(
  'patient_medications',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    /** References users.id — the patient's user ID */
    patientId: t
      .uuid('patient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    medicationExternalId: t.text('medication_external_id'),
    source: t.text('source').notNull().default('api-medicaments-fr'),
    cis: t.text('cis'),
    cip: t.text('cip'),
    medicationName: t.text('medication_name').notNull(),
    medicationForm: t.text('medication_form'),
    activeSubstances: t.jsonb('active_substances'),
    dosageLabel: t.text('dosage_label'),
    instructions: t.text('instructions'),
    startDate: t.date('start_date', { mode: 'string' }).notNull(),
    endDate: t.date('end_date', { mode: 'string' }),
    isActive: t.boolean('is_active').notNull().default(true),
    createdAt: t
      .timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t.timestamp('updated_at').$onUpdateFn(() => new Date()),
  }),
  table => [
    index('patient_medications_patient_idx').on(table.patientId),
    index('patient_medications_active_idx').on(table.patientId, table.isActive),
    index('patient_medications_name_idx').on(table.medicationName),
  ],
);

export const patientMedicationSchedules = pgTable(
  'patient_medication_schedules',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    patientMedicationId: t
      .uuid('patient_medication_id')
      .notNull()
      .references(() => patientMedications.id, { onDelete: 'cascade' }),
    weekday: t.integer('weekday'),
    intakeTime: t.varchar('intake_time', { length: 5 }).notNull(),
    intakeMoment: intakeMomentEnum('intake_moment').notNull().default('CUSTOM'),
    quantity: t.text('quantity').notNull().default('1'),
    unit: t.text('unit'),
    notes: t.text('notes'),
    createdAt: t
      .timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t.timestamp('updated_at').$onUpdateFn(() => new Date()),
  }),
  table => [
    index('patient_medication_schedules_med_idx').on(table.patientMedicationId),
    unique('patient_medication_schedules_med_id_uniq').on(table.patientMedicationId, table.id),
  ],
);

export const patientMedicationIntakes = pgTable(
  'patient_medication_intakes',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    patientMedicationId: t
      .uuid('patient_medication_id')
      .notNull()
      .references(() => patientMedications.id, { onDelete: 'cascade' }),
    scheduleId: t.uuid('schedule_id'),
    scheduledDate: t.date('scheduled_date', { mode: 'string' }).notNull(),
    scheduledTime: t.varchar('scheduled_time', { length: 5 }).notNull(),
    status: intakeStatusEnum('status').notNull().default('PENDING'),
    takenAt: t.timestamp('taken_at'),
    notes: t.text('notes'),
    createdAt: t
      .timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  table => [
    index('patient_medication_intakes_med_date_idx').on(
      table.patientMedicationId,
      table.scheduledDate,
    ),
    index('patient_medication_intakes_status_idx').on(table.scheduledDate, table.status),
    foreignKey({
      columns: [table.patientMedicationId, table.scheduleId],
      foreignColumns: [
        patientMedicationSchedules.patientMedicationId,
        patientMedicationSchedules.id,
      ],
    }).onDelete('set null'),
    unique('patient_medication_intakes_med_sched_date_uniq').on(
      table.patientMedicationId,
      table.scheduleId,
      table.scheduledDate,
    ),
  ],
);

export const patientMedicationsRelations = relations(patientMedications, ({ one, many }) => ({
  user: one(users, {
    fields: [patientMedications.patientId],
    references: [users.id],
  }),
  schedules: many(patientMedicationSchedules),
  intakes: many(patientMedicationIntakes),
}));

export const patientMedicationSchedulesRelations = relations(
  patientMedicationSchedules,
  ({ one }) => ({
    patientMedication: one(patientMedications, {
      fields: [patientMedicationSchedules.patientMedicationId],
      references: [patientMedications.id],
    }),
  }),
);

export const patientMedicationIntakesRelations = relations(patientMedicationIntakes, ({ one }) => ({
  patientMedication: one(patientMedications, {
    fields: [patientMedicationIntakes.patientMedicationId],
    references: [patientMedications.id],
  }),
  schedule: one(patientMedicationSchedules, {
    fields: [patientMedicationIntakes.scheduleId],
    references: [patientMedicationSchedules.id],
  }),
}));
