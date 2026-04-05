// import { type Auth /*ac, adminRole, userRole*/ } from '@server/lib/auth';

import type { Auth } from '@server/lib/auth';
import {
  adminClient,
  customSessionClient,
  inferAdditionalFields,
  lastLoginMethodClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const authClientOptions = {
  baseURL: import.meta.env.VITE_SERVER_URL,
  sessionOptions: {
    // Prevent session refetch on window focus — it causes a brief null session
    // that triggers the auth guard redirect (login → home flicker).
    refetchOnWindowFocus: false,
  },
  plugins: [
    inferAdditionalFields<Auth>(),
    customSessionClient<Auth>(),
    lastLoginMethodClient(),
    adminClient(),
  ],
};

export type AuthClient = ReturnType<typeof createAuthClient<typeof authClientOptions>>;
export const authClient: AuthClient = createAuthClient(authClientOptions);
