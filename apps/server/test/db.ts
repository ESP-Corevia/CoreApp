import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { reset } from 'drizzle-seed';

import * as schema from '../src/db/schema';

const MIGRATIONS_DIR = 'src/db/migrations';

export const dbClient = new PGlite('memory://');
export const db = drizzle(dbClient, {
  schema,
  casing: 'snake_case',
  logger: true,
});

let hasMigrated = false;

export async function applyMigration() {
  if (hasMigrated) return;

  for (const file of readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const raw = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    const sql = raw.replace(
      // eslint-disable-next-line security/detect-unsafe-regex
      /CREATE\s+EXTENSION\s+(IF\s+NOT\s+EXISTS\s+)?("?pgcrypto"?);?/gi,
      '-- [pglite] skipped: $&',
    );
    await dbClient.exec(sql);
  }

  hasMigrated = true;
}

export async function resetDb() {
  await reset(db, schema);
}
