import { relations } from 'drizzle-orm';
import { pgTable, index } from 'drizzle-orm/pg-core';

import { users } from './auth';

export const doctors = pgTable(
  'doctors',
  (t) => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    userId: t
      .uuid('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    specialty: t.text('specialty').notNull(),
    address: t.text('address').notNull(),
    city: t.text('city').notNull(),
  }),
  (table) => [
    index('doctors_specialty_idx').on(table.specialty),
    index('doctors_city_idx').on(table.city),
    index('doctors_user_id_idx').on(table.userId),
  ],
);

export const doctorsRelations = relations(doctors, ({ one }) => ({
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
}));
