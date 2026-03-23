// import { type Auth /*ac, adminRole, userRole*/ } from '@server/lib/auth';

import type { Auth } from '@server/lib/auth';
import {
  adminClient,
  customSessionClient,
  inferAdditionalFields,
  lastLoginMethodClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [
    inferAdditionalFields<Auth>(),
    customSessionClient<Auth>(),
    lastLoginMethodClient(),
    adminClient(),
    // adminClient(),
  ],
});
