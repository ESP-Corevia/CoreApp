import { relations } from 'drizzle-orm';
import { index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { users } from './auth';

/** Genre du patient. */
export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);

/** Groupe sanguin du patient. */
export const bloodTypeEnum = pgEnum('blood_type', [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
]);

/**
 * Profil patient : informations médicales et personnelles liées à un utilisateur ayant le rôle "patient".
 * Relation 1:1 avec `users` via `userId`. Contient date de naissance, genre, groupe sanguin,
 * allergies et contact d'urgence.
 */
export const patients = pgTable(
  'patients',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    userId: t
      .uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    dateOfBirth: t.date('date_of_birth', { mode: 'string' }).notNull(),
    gender: genderEnum('gender').notNull(),
    phone: t.text('phone'),
    address: t.text('address'),
    bloodType: bloodTypeEnum('blood_type'),
    allergies: t.text('allergies'),
    emergencyContactName: t.text('emergency_contact_name'),
    emergencyContactPhone: t.text('emergency_contact_phone'),
  }),
  table => [
    index('patients_user_id_idx').on(table.userId),
    index('patients_dob_idx').on(table.dateOfBirth),
  ],
);

/** Relation Drizzle : chaque profil patient est lié à un seul utilisateur. */
export const patientsRelations = relations(patients, ({ one }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
}));
