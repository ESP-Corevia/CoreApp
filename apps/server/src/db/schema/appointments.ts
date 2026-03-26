import { index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { users } from './auth';

/** Statut d'un rendez-vous : en attente, confirmé, annulé ou terminé. */
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
]);

/**
 * Rendez-vous entre un médecin et un patient.
 * Les champs `doctorId` et `patientId` référencent `users.id` (pas `doctors.id` / `patients.id`).
 * Indexée par (médecin, date), par patient, et par statut pour les requêtes courantes.
 */
export const appointments = pgTable(
  'appointments',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    /** References users.id — the doctor's user ID, not doctors.id */
    doctorId: t
      .uuid('doctor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** References users.id — the patient's user ID */
    patientId: t
      .uuid('patient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: t.date('date', { mode: 'string' }).notNull(),
    time: t.varchar('time', { length: 5 }).notNull(),
    status: appointmentStatusEnum('status').notNull().default('PENDING'),
    reason: t.text('reason'),
    createdAt: t
      .timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t.timestamp('updated_at').$onUpdateFn(() => new Date()),
  }),
  table => [
    index('appointments_doctor_date_idx').on(table.doctorId, table.date),
    index('appointments_patient_idx').on(table.patientId),
    index('appointments_status_idx').on(table.status),
  ],
);

/**
 * Créneaux bloqués par un médecin (indisponibilités).
 * Empêche la prise de rendez-vous sur ces créneaux.
 * Le `doctorId` référence `users.id` (le user ID du médecin).
 */
export const doctorBlocks = pgTable(
  'doctor_blocks',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    /** References users.id — the doctor's user ID, not doctors.id */
    doctorId: t
      .uuid('doctor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: t.date('date', { mode: 'string' }).notNull(),
    time: t.varchar('time', { length: 5 }).notNull(),
    reason: t.text('reason'),
  }),
  table => [index('doctor_blocks_doctor_date_idx').on(table.doctorId, table.date)],
);
