import { eq, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

import { db as DB } from '../index';
import { users } from '../schema';

import type * as schema from '../schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type DrizzleDB = PostgresJsDatabase<typeof schema>;
export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

export const createUsersRepo = (db: DrizzleDB = DB) => ({
  /**
   * Finds a user by their ID.
   * @param id - The UUID of the user.
   */
  findById: async ({ id }: { id: string }) => {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },
  /**
   * Finds a user by their email address.
   * @param email - The email of the user.
   */
  findByEmail: async (email: string): Promise<User | undefined> => {
    return await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },
});
