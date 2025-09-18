import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { logger } from '../lib/logger';

// Create a pg Pool so we can monitor and reuse connections. Drizzle accepts a pool.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
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
