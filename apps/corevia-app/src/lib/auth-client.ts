import type { Auth } from '@server/lib/auth';
import {
  customSessionClient,
  inferAdditionalFields,
  lastLoginMethodClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const authClientOptions = {
  baseURL: import.meta.env.VITE_SERVER_URL,
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
  plugins: [inferAdditionalFields<Auth>(), customSessionClient<Auth>(), lastLoginMethodClient()],
} satisfies Parameters<typeof createAuthClient>[0];

export type AuthClient = ReturnType<typeof createAuthClient<typeof authClientOptions>>;
export const authClient: AuthClient = createAuthClient(authClientOptions);
