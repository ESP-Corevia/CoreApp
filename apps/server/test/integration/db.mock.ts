import * as schema from '../../src/db/schema';
import { db, dbClient } from '../db';

/**
 * Drop-in replacement for `src/db` used by the integration suite.
 *
 * Every module that reaches for the database (better-auth's drizzle adapter, the
 * repository singletons, the service singletons) resolves to this module instead, so the
 * whole application runs against the in-memory PGlite database created in `test/db.ts`.
 */
export { db, schema };

export const pool = {
  end: async (): Promise<void> => {
    await dbClient.close();
  },
};
