import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI, customSession, admin, lastLoginMethod } from 'better-auth/plugins';

import { db } from '../db';
import * as schemas from '../db/schema/auth';
import { env } from '../env';

import { ac, adminRole, userRole } from './permissions';
export const auth = betterAuth({
  appName: 'Corevia',
  // basePath: '/api/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    debugLogs: env.NODE_ENV === 'development' || env.NODE_ENV === 'test',
    schema: {
      users: schemas.users,
      sessions: schemas.sessions,
      accounts: schemas.accounts,
      verifications: schemas.verifications,
    },
  }),
  user: {
    additionalFields: {
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true },
    },
    changeEmail: {
      enabled: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  advanced: {
    database: {
      generateId: false,
    },
    useSecureCookies: env.NODE_ENV !== 'development',
    ipAddress: {
      ipAddressHeaders: ['x-client-ip', 'x-forwarded-for'],
      disableIpTracking: false,
    },
    cookies: {
      session_token: {
        attributes: {
          path: '/',
          httpOnly: true,
          sameSite: 'none',
          secure: true,
        },
      },
      session_data: {
        attributes: {
          path: '/',
          httpOnly: true,
          sameSite: 'none',
          secure: true,
        },
      },
      dont_remember: {
        attributes: {
          path: '/',
          httpOnly: true,
          sameSite: 'none',
          secure: true,
        },
      },
    },
  },
  plugins: [
    openAPI(),
    // eslint-disable-next-line require-await
    customSession(async ({ session }) => ({
      isAuthenticated: !!session,
      userId: session?.userId,
      impersonatedBy: (session as any).impersonatedBy ?? null,
    })),
    admin({
      ac,
      roles: { user: userRole, admin: adminRole },
    }),
    lastLoginMethod({
      storeInDatabase: true,
    }),
  ],
});
export type Auth = typeof auth;
export type { ac, adminRole, userRole };
