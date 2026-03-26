import { and, eq, type InferInsertModel, type InferSelectModel, ne, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { QueryOptions } from '../../utils/db';
import { db as DB } from '../index';
import type * as schema from '../schema';
import { doctors, patients, users } from '../schema';

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

  listUsersWithDetails: async ({
    options,
    pageParams,
    userId,
  }: {
    options: QueryOptions;
    pageParams: { page?: number; perPage?: number };
    userId: string;
  }) => {
    const { page = 1, perPage = 10 } = pageParams;

    let whereClause: ReturnType<typeof and> = ne(users.id, userId);
    if (options.where) {
      whereClause = and(options.where, whereClause);
    }

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        lastLoginMethod: users.lastLoginMethod,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        patientDateOfBirth: patients.dateOfBirth,
        patientGender: patients.gender,
        patientPhone: patients.phone,
        patientAddress: patients.address,
        patientBloodType: patients.bloodType,
        patientAllergies: patients.allergies,
        patientEmergencyContactName: patients.emergencyContactName,
        patientEmergencyContactPhone: patients.emergencyContactPhone,
        doctorSpecialty: doctors.specialty,
        doctorAddress: doctors.address,
        doctorCity: doctors.city,
      })
      .from(users)
      .leftJoin(patients, eq(patients.userId, users.id))
      .leftJoin(doctors, eq(doctors.userId, users.id))
      .where(whereClause)
      .limit(options.limit ?? perPage)
      .offset(options.offset ?? 0);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause ?? sql`TRUE`);

    const totalItems = Number(count);
    const totalPages = Math.ceil(totalItems / perPage);

    const items = rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      image: row.image,
      role: row.role,
      banned: row.banned,
      banReason: row.banReason,
      banExpires: row.banExpires,
      lastLoginMethod: row.lastLoginMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      patient: row.patientDateOfBirth
        ? {
            dateOfBirth: row.patientDateOfBirth,
            gender: row.patientGender,
            phone: row.patientPhone,
            address: row.patientAddress,
            bloodType: row.patientBloodType,
            allergies: row.patientAllergies,
            emergencyContactName: row.patientEmergencyContactName,
            emergencyContactPhone: row.patientEmergencyContactPhone,
          }
        : null,
      doctor: row.doctorSpecialty
        ? {
            specialty: row.doctorSpecialty,
            address: row.doctorAddress,
            city: row.doctorCity,
          }
        : null,
    }));

    return {
      users: items,
      totalItems,
      totalPages,
      page,
      perPage,
    };
  },
});
