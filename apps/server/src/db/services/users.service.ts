import { z } from 'zod';

import type { Repositories } from '../repositories';

export const UserOutputSchema = z.object({
  id: z.uuid(),
  name: z.string().nullable(),
  email: z.email(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  image: z.url().nullable(),
  lastLoginMethod: z.string().nullable(),
  emailVerified: z.boolean().nullable(),
  role: z.string().nullable(),
});
type UserOutput = z.infer<typeof UserOutputSchema>;
export const createUsersService = (repo: Repositories['usersRepo']) => ({
  /**
   * Finds a user by their ID, optionally including their API keys.
   * @param id - The UUID of the user.
   * @param includeApiKeys - Whether to include the user's API keys in the result.
   * @returns The user object or undefined if not found.
   */
  findById: async ({ id }: { id: string }) => {
    return await repo.findById({ id });
  },
  /**
   * Finds a user by their email address.
   * @param email - The email of the user.
   * @returns The user object or undefined if not found.
   */
  findByEmail: async (email: string) => {
    return await repo.findByEmail(email);
  },
  /**
   * Get the current user's profile information
   * @param userId - The UUID of the user.
   * @returns The user profile information including API key if available.
   * @throws Error if the user is not found.
   */
  getMe: async (userId: string): Promise<UserOutput> => {
    const user = await repo.findById({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginMethod: user.lastLoginMethod,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      emailVerified: user.emailVerified,
      role: user.role,
    };
  },
});
