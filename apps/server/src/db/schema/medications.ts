import { relations } from 'drizzle-orm';
import { foreignKey, index, pgEnum, pgTable, unique } from 'drizzle-orm/pg-core';

import { users } from './auth';

/** Moment de la journée pour la prise d'un médicament. */
export const intakeMomentEnum = pgEnum('intake_moment', [
  'MORNING',
  'NOON',
  'EVENING',
  'BEDTIME',
  'CUSTOM',
]);

/** Statut d'une prise de médicament : en attente, pris ou sauté. */
export const intakeStatusEnum = pgEnum('intake_status', ['PENDING', 'TAKEN', 'SKIPPED']);

/**
 * Médicaments prescrits/suivis par un patient.
 * Chaque entrée représente un médicament actif ou passé dans le traitement du patient.
 * Contient les infos du médicament (nom, forme, substances actives, codes CIS/CIP)
 * ainsi que les dates de début/fin du traitement.
 */
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

/**
 * Planning de prises pour un médicament donné.
 * Définit quand et combien le patient doit prendre son médicament
 * (ex : 1 comprimé le matin à 08:00, tous les lundis).
 * `weekday` est optionnel : null = tous les jours, sinon 0=dimanche..6=samedi.
 */
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

/**
 * Historique des prises effectives de médicaments.
 * Chaque ligne correspond à une prise planifiée pour une date donnée.
 * Le statut indique si le patient a pris (TAKEN), sauté (SKIPPED) ou n'a pas encore confirmé (PENDING).
 * Contrainte unique sur (médicament, schedule, date) pour éviter les doublons.
 */
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

/** Relations Drizzle : un médicament patient appartient à un utilisateur et possède plusieurs schedules et prises. */
export const patientMedicationsRelations = relations(patientMedications, ({ one, many }) => ({
  user: one(users, {
    fields: [patientMedications.patientId],
    references: [users.id],
  }),
  schedules: many(patientMedicationSchedules),
  intakes: many(patientMedicationIntakes),
}));

/** Relation Drizzle : chaque schedule appartient à un médicament patient. */
export const patientMedicationSchedulesRelations = relations(
  patientMedicationSchedules,
  ({ one }) => ({
    patientMedication: one(patientMedications, {
      fields: [patientMedicationSchedules.patientMedicationId],
      references: [patientMedications.id],
    }),
  }),
);

/** Relations Drizzle : chaque prise est liée à un médicament patient et optionnellement à un schedule. */
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
