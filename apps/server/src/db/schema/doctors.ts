import { pgTable, index } from 'drizzle-orm/pg-core';

export const doctors = pgTable(
  'doctors',
  (t) => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    name: t.text('name').notNull(),
    specialty: t.text('specialty').notNull(),
    address: t.text('address').notNull(),
    city: t.text('city').notNull(),
    imageUrl: t.text('image_url'),
    createdAt: t
      .timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (table) => [
    index('doctors_specialty_idx').on(table.specialty),
    index('doctors_city_idx').on(table.city),
    index('doctors_name_idx').on(table.name),
  ],
);
