import { relations } from 'drizzle-orm';
import { index, pgTable } from 'drizzle-orm/pg-core';

import { users } from './auth';

/**
 * Profil médecin : informations professionnelles liées à un utilisateur ayant le rôle "doctor".
 * Relation 1:1 avec `users` via `userId`. Contient la spécialité, l'adresse et la ville du cabinet.
 */
export const doctors = pgTable(
  'doctors',
  t => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    userId: t
      .uuid('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    specialty: t.text('specialty').notNull(),
    address: t.text('address').notNull(),
    city: t.text('city').notNull(),
  }),
  table => [
    index('doctors_specialty_idx').on(table.specialty),
    index('doctors_city_idx').on(table.city),
    index('doctors_user_id_idx').on(table.userId),
  ],
);

/** Relation Drizzle : chaque profil médecin est lié à un seul utilisateur. */
export const doctorsRelations = relations(doctors, ({ one }) => ({
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
}));
