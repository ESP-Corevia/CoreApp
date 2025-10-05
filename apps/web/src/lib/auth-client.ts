import { createAuthClient } from "better-auth/react";
import type { Auth } from "@server/lib/auth";
import {
  customSessionClient,
  lastLoginMethodClient,
  adminClient,
} from "better-auth/client/plugins";
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [
    customSessionClient<Auth>(),
    lastLoginMethodClient(),
    adminClient(),
  ],
});
