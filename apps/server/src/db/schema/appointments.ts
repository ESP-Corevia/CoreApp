import { index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { users } from './auth';
import { doctors } from './doctors';

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
]);

export const appointments = pgTable(
  'appointments',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    doctorId: t
      .uuid('doctor_id')
      .notNull()
      .references(() => doctors.id, { onDelete: 'cascade' }),
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

export const doctorBlocks = pgTable(
  'doctor_blocks',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    doctorId: t
      .uuid('doctor_id')
      .notNull()
      .references(() => doctors.id, { onDelete: 'cascade' }),
    date: t.date('date', { mode: 'string' }).notNull(),
    time: t.varchar('time', { length: 5 }).notNull(),
    reason: t.text('reason'),
  }),
  table => [index('doctor_blocks_doctor_date_idx').on(table.doctorId, table.date)],
);
