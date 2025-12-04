import { eq, type InferSelectModel, type InferInsertModel, sql, and, ne } from 'drizzle-orm';

import { db as DB } from '../index';
import { users } from '../schema';

import type { QueryOptions } from '../../utils/db';
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
  /**   * Gets a paginated list of users, excluding the specified userId.
   * @param options - Query options for filtering, sorting, etc.
   * @param pageParams - Pagination parameters (page number and items per page).
   * @param userId - The UUID of the user to exclude from the results.
   * @returns A paginated list of users.
   */
  listUsers: async ({
    options,
    pageParams,
    userId,
  }: {
    options: QueryOptions;
    pageParams: { page?: number; perPage?: number };
    userId: string;
  }) => {
    const { page = 1, perPage = 10 } = pageParams;
    if (options.where) {
      options.where = and(options.where, ne(users.id, userId));
    } else {
      options.where = ne(users.id, userId);
    }
    const items = await db.query.users.findMany({
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(options.where ?? sql`TRUE`);

    const totalItems = Number(count);
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      users: items,
      totalItems,
      totalPages,
      page: page,
      perPage: perPage,
    };
  },
});
