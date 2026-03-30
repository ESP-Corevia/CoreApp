import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { env } from '../env';
import { logger } from '../lib/logger';

import * as schema from './schema';

const { Pool } = pg;
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
});

pool.on('error', err => {
  logger.error({ err }, 'Unexpected idle client error');
});

pool.on('connect', () => {
  logger.info('Postgres client connected');
});

export const db = drizzle(pool, {
  schema,
  logger: env.NODE_ENV !== 'production',
});
export { pool, schema };
