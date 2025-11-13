import {
  customSessionClient,
  lastLoginMethodClient,
  adminClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import type { Auth } from '@server/lib/auth';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [
    inferAdditionalFields<Auth>(),
    customSessionClient<Auth>(),
    lastLoginMethodClient(),
    adminClient(),
  ],
});
