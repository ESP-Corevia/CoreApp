import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../env';
import { logger } from '../lib/logger';

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
  logger: true,
});

export { pool };
