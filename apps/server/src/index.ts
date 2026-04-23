/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import fs from 'node:fs';
import path from 'node:path';
import fastifyCors from '@fastify/cors';
import helmet from '@fastify/helmet';
import ScalarApiReference from '@scalar/fastify-api-reference';
import { type FastifyTRPCPluginOptions, fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';
import { fastifyTRPCOpenApiPlugin, generateOpenApiDocument } from 'trpc-to-openapi';
import pkg from '../package.json';
import { pool } from './db';
import { services } from './db/services';
import { env } from './env';
import { auth } from './lib/auth';
import printBanner from './lib/banner';
import { createContext } from './lib/context';
import { createStorageService } from './lib/storage';
import { chatRoutePlugin } from './routers/ai/chatRoute';
import { type AppRouter, appRouter } from './routers/index';
import { mergeOpenApiDocs } from './utils/functions';

const certPath = path.resolve(import.meta.dirname, '../../../certs/cert.pem');
const keyPath = path.resolve(import.meta.dirname, '../../../certs/key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);
const CORS_PROD_RE  = /^https:\/\/([a-z0-9-]+\.)*corevia\.world$/;

const baseCorsConfig = {
  origin: [
    CORS_PROD_RE,
    env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://10.0.2.2:3000',
    ...(hasCerts
      ? ['https://localhost:5173', 'https://localhost:3000', 'https://127.0.0.1:3000']
      : []),
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key', 'x-language'],
  maxAge: 86400,
  exposedHeaders: ['Set-Cookie'],
};

const isProduction = env.NODE_ENV === 'production';

const fastify = Fastify({
  logger: isProduction
    ? { level: env.LOG_LEVEL }
    : {
        level: env.LOG_LEVEL,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'HH:MM:ss Z',
          },
        },
      },
  ...(hasCerts && {
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
  }),
});

fastify.register(fastifyCors, baseCorsConfig);
await fastify.register(helmet, {
  global: true,
  contentSecurityPolicy: false,
});

fastify.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    try {
      const proto = hasCerts ? 'https' : 'http';
      const url = new URL(request.url, `${proto}://${request.headers.host}`);
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });
      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });
      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      fastify.log.error({ err: error }, 'Authentication Error:');
      reply.status(500).send({
        error: 'Internal authentication error',
        code: 'AUTH_FAILURE',
      });
    }
  },
});

// --- AI Chat route ---
fastify.register(chatRoutePlugin, { auth, services });

fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: opts => createContext({ ...opts, auth, services }),
    onError({ path, error }) {
      fastify.log.error({ path, err: error }, `Error in tRPC handler on path '${path}'`);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

fastify.get('/', () => {
  return 'OK';
});

fastify.get('/health', () => {
  return { status: 'ok' };
});
fastify.register(fastifyTRPCOpenApiPlugin, {
  basePath: '/api',
  router: appRouter,
  createContext: (opts: any) => createContext({ ...opts, auth, services }),
});
fastify.get('/openapi.json', async (_req, reply) => {
  const trpcDoc = generateOpenApiDocument(appRouter, {
    title: 'Corevia tRPC API',
    version: pkg.version,
    baseUrl: `${env.BASE_URL}/api`,
  });
  const authDoc = await auth.api.generateOpenAPISchema();
  const merged = mergeOpenApiDocs(trpcDoc, authDoc);

  // Manually add the /chat route (not managed by tRPC)
  merged.paths['/chat'] = {
    post: {
      operationId: 'chat',
      summary: 'AI Chat (SSE streaming)',
      description:
        'Stream a conversation with the AI assistant. Uses the AI SDK UI Message protocol. The response is a streaming text/x-ui-message-stream-part body. Tools are selected based on the authenticated user role (patient, doctor, admin).',
      tags: ['AI'],
      servers: [{ url: env.BASE_URL }],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['messages'],
              properties: {
                messages: {
                  type: 'array',
                  description: 'Array of UI messages (AI SDK UIMessage format)',
                  items: {
                    type: 'object',
                    required: ['id', 'role', 'parts'],
                    properties: {
                      id: { type: 'string' },
                      role: { type: 'string', enum: ['user', 'assistant'] },
                      parts: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type: { type: 'string' },
                            text: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Streaming AI response',
          content: {
            'text/x-ui-message-stream-part': {
              schema: { type: 'string' },
            },
          },
        },
        '401': { description: 'Unauthorized — no active session' },
        '400': { description: 'Bad request — messages is required' },
        '500': { description: 'AI chat failed' },
      },
    },
  };

  // Add AI tag if not present
  if (!merged.tags.some((t: any) => t.name === 'AI')) {
    merged.tags.push({ name: 'AI', description: 'AI Assistant endpoints' });
  }

  reply.header('Content-Type', 'application/json').send(merged);
});

fastify.register(ScalarApiReference, {
  routePrefix: '/reference',
  configuration: {
    url: '/openapi.json',
    title: `Corevia tRPC API`,
    layout: 'modern',
    theme: 'purple',
    darkMode: true,
  },
});

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
