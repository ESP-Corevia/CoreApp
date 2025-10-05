import type { Repositories } from '../repositories';
type UserOutput = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date | null;
  firstName: string;
  lastName: string;
  image: string | null;
  lastLoginMethod: string | null;
};
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
   * @throws {UserNotFoundError} When user is not found
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
    };
  },
});
