import {
  and,
  eq,
  type InferInsertModel,
  type InferSelectModel,
  ilike,
  ne,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { escapeLike, type QueryOptions } from '../../utils/db';
import { db as DB } from '../index';
import type * as schema from '../schema';
import { doctorUsersView, patientUsersView, users } from '../schema';

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
  updateById: async (id: string, data: Partial<Pick<User, 'name' | 'image'>>) => {
    const [row] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return row ?? null;
  },

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

  /**
   * Liste les utilisateurs avec leur profil (doctor ou patient) via les vues SQL.
   * @param role - "doctor" ou "patient" : détermine quelle vue est interrogée.
   * @param search - Recherche optionnelle sur le nom ou l'email (ilike).
   * @param id - Filtre optionnel par user ID exact.
   */
  listUsersWithDetails: async ({
    role,
    search,
    id,
    page = 1,
    perPage = 10,
  }: {
    role: 'doctor' | 'patient';
    search?: string;
    id?: string;
    page?: number;
    perPage?: number;
  }) => {
    const view = role === 'doctor' ? doctorUsersView : patientUsersView;

    const conditions: SQL<unknown>[] = [];
    if (id) {
      conditions.push(eq(view.userId, id));
    }
    if (search) {
      const escaped = escapeLike(search);
      const searchCondition = or(
        ilike(view.name, `%${escaped}%`),
        ilike(view.email, `%${escaped}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(view)
        .where(whereClause)
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ count: sql<number>`count(*)` })
        .from(view)
        .where(whereClause ?? sql`TRUE`),
    ]);

    const totalItems = Number(count);

    return {
      users: items,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      page,
      perPage,
    };
  },
});
