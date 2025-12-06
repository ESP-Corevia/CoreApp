import { relations } from 'drizzle-orm';
import { pgTable, index } from 'drizzle-orm/pg-core';
export const users = pgTable(
  'users',
  (t) => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    name: t.text('name'),
    firstName: t.text('first_name').notNull(),
    lastName: t.text('last_name').notNull(),
    email: t.text('email').notNull().unique(),
    emailVerified: t
      .boolean('email_verified')
      .$defaultFn(() => false)
      .notNull(),
    image: t.text('image'),
    role: t.text('role'),
    banned: t.boolean('banned').notNull().default(false),
    banReason: t.text('ban_reason'),
    banExpires: t.timestamp('ban_expires'),
    lastLoginMethod: t.text('last_login_method'),
    createdAt: t
      .timestamp('created_at')
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: t.timestamp('updated_at').$onUpdateFn(() => new Date()),
    seeded: t.boolean('seeded').default(false),
  }),
  (table) => [index('email_idx').on(table.email)],
);

export const sessions = pgTable(
  'sessions',
  (t) => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    expiresAt: t.timestamp('expires_at').notNull(),
    token: t.text('token').notNull().unique(),
    createdAt: t.timestamp('created_at').notNull(),
    updatedAt: t.timestamp('updated_at').$onUpdateFn(() => new Date()),
    ipAddress: t.text('ip_address'),
    userAgent: t.text('user_agent'),
    userId: t
      .uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    impersonatedBy: t.text('impersonated_by'),
  }),
  (table) => [index('session_user_id_idx').on(table.userId), index('token_idx').on(table.token)],
);

export const accounts = pgTable(
  'accounts',
  (t) => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    accountId: t.text('account_id').notNull(),
    providerId: t.text('provider_id').notNull(),
    userId: t
      .uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: t.text('access_token'),
    refreshToken: t.text('refresh_token'),
    idToken: t.text('id_token'),
    accessTokenExpiresAt: t.timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: t.timestamp('refresh_token_expires_at'),
    scope: t.text('scope'),
    password: t.text('password'),
    createdAt: t.timestamp('created_at').notNull(),
    updatedAt: t.timestamp('updated_at').$onUpdateFn(() => new Date()),
  }),
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verifications = pgTable(
  'verifications',
  (t) => ({
    id: t.uuid('id').defaultRandom().primaryKey(),
    identifier: t.text('identifier').notNull(),
    value: t.text('value').notNull(),
    expiresAt: t.timestamp('expires_at').notNull(),
    createdAt: t.timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: t.timestamp('updated_at').$onUpdateFn(() => new Date()),
  }),
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
