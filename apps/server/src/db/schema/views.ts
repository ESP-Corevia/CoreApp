import { boolean, pgView, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
