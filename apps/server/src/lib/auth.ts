import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI, customSession } from 'better-auth/plugins';

import { db } from '../db';
import * as schema from '../db/schema/auth';
import { env } from '../env';
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    debugLogs: true,
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
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
    })),
  ],
});
export type Auth = typeof auth;
