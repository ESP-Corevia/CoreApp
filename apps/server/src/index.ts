import { buildApp, hasCerts } from './app';
import { pool } from './db';
import { services } from './db/services';
import { env } from './env';
import { auth } from './lib/auth';
import printBanner from './lib/banner';
import { createStorageService } from './lib/storage';

const fastify = await buildApp({ auth, services });

const protocol = hasCerts ? 'https' : 'http';

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  fastify.log.info({ signal }, 'Shutting down server');

  try {
    await fastify.close();
    await pool.end();
    fastify.log.info('Server shutdown complete');
    process.exit(0);
  } catch (error) {
    fastify.log.error({ err: error, signal }, 'Failed to shutdown cleanly');
    process.exit(1);
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

// Ensure S3 bucket exists
fastify.log.info('🪣 Initializing S3 storage...');
const storageService = createStorageService();
await storageService.ensureBucket();
fastify.log.info('✅ S3 storage initialized');

fastify.listen({ port: env.PORT, host: '0.0.0.0' }, err => {
  if (err) {
    fastify.log.error(err);
    void pool.end().finally(() => process.exit(1));
    return;
  }
  const addr = fastify.server.address();
  const url =
    addr && typeof addr === 'object'
      ? `${protocol}://${addr.address}:${addr.port}`
      : `${protocol}://localhost:${env.PORT}`;
  printBanner('CoreviaBackend', `Corevia API listening at ${url}`);

  fastify.log.info(`Server running on port ${env.PORT} (${protocol})`);
});
