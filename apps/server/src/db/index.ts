import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../env';
import { logger } from '../lib/logger';

import * as schema from './schema';
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected idle client error');
});

pool.on('connect', () => {
  logger.info('Postgres client connected');
});

export const db = drizzle(pool, {
  schema,
  logger: true,
});
export { schema };
export { pool };
