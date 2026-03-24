import { sql } from 'drizzle-orm';

import { db, pool } from '../src/db';
import { logger } from '../src/lib/logger';

async function main() {
  logger.info('🗑️  Dropping all tables...');

  await db.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
      ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$
  `);

  // Drop all custom enum types as well
  await db.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT typname FROM pg_type
        JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        WHERE pg_namespace.nspname = 'public' AND pg_type.typtype = 'e'
      ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
    END $$
  `);

  logger.info('✔ All tables and enums dropped.');

  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    logger.error('❌ Reset error:', err);
    process.exit(1);
  });
