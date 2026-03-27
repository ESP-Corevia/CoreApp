import { boolean, pgView, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Vue SQL qui joint `users` + `doctors` pour obtenir le profil complet d'un médecin en une seule requête.
 * Évite de faire un JOIN manuel à chaque fois qu'on a besoin des infos utilisateur + médecin.
 * Marquée `.existing()` car le SQL de la vue est maintenu manuellement dans la migration.
 */
export const doctorUsersView = pgView('doctor_users_view', {
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  role: text('role'),
  banned: boolean('banned').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
  doctorId: uuid('doctor_id').notNull(),
  specialty: text('specialty').notNull(),
  doctorAddress: text('doctor_address').notNull(),
  city: text('city').notNull(),
}).existing();

/**
 * Vue SQL qui joint `users` + `patients` pour obtenir le profil complet d'un patient en une seule requête.
 * Inclut les infos médicales (groupe sanguin, allergies, contact d'urgence) et les infos utilisateur.
 * Marquée `.existing()` car le SQL de la vue est maintenu manuellement dans la migration.
 */
export const patientUsersView = pgView('patient_users_view', {
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  role: text('role'),
  banned: boolean('banned').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
  patientId: uuid('patient_id').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  gender: text('gender').notNull(),
  phone: text('phone'),
  patientAddress: text('patient_address'),
  bloodType: text('blood_type'),
  allergies: text('allergies'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
}).existing();
