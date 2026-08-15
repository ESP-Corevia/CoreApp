import fs from 'node:fs';
import path from 'node:path';
import fastifyCors from '@fastify/cors';
import helmet from '@fastify/helmet';
import ScalarApiReference from '@scalar/fastify-api-reference';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { type FastifyTRPCPluginOptions, fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { fastifyTRPCOpenApiPlugin, generateOpenApiDocument } from 'trpc-to-openapi';

import pkg from '../package.json';

import type { Services } from './db/services';
import { env } from './env';
import type { auth as authInstance } from './lib/auth';
import { createContext } from './lib/context';
import { chatRoutePlugin } from './routers/ai/chatRoute';
import { type AppRouter, appRouter } from './routers/index';
import { mergeOpenApiDocs } from './utils/functions';

const certPath = path.resolve(import.meta.dirname, '../../../certs/cert.pem');
const keyPath = path.resolve(import.meta.dirname, '../../../certs/key.pem');
/** True when local TLS certificates are available, which switches the app to https. */
export const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);
const CORS_PROD_RE = /^https:\/\/([a-z0-9-]+\.)*corevia\.world$/;

const isProduction = env.NODE_ENV === 'production';

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

/* istanbul ignore next -- process-wide logger shape, only the non-production branch runs in tests */
const defaultLogger: FastifyServerOptions['logger'] = isProduction
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
    };

export interface BuildAppOptions {
  /** better-auth instance handling `/api/auth/*` and session resolution. */
  auth: typeof authInstance;
  /** Service layer injected into the tRPC context. */
  services: Services;
  /** Fastify logger option; pass `false` in tests to silence output. */
  logger?: FastifyServerOptions['logger'];
}

/**
 * Builds the fully wired Fastify application without binding a port.
 *
 * Everything the HTTP surface exposes is registered here (CORS, helmet, better-auth,
 * tRPC, the AI chat route, health probes and the OpenAPI/Scalar documentation), so the
 * exact same instance can be started by `index.ts` or driven in tests via `app.inject()`.
 */
export async function buildApp({
  auth,
  services,
  logger = defaultLogger,
}: BuildAppOptions): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger,
    /* istanbul ignore next -- https is only wired when local TLS certificates exist */
    ...(hasCerts && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
  });

  await fastify.register(fastifyCors, baseCorsConfig);
  await fastify.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
  });

  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      try {
        /* istanbul ignore next -- https only when local TLS certificates exist */
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
  await fastify.register(chatRoutePlugin, { auth, services });

  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: opts => createContext({ ...opts, auth, services }),
      onError({ path: trpcPath, error }) {
        fastify.log.error(
          { path: trpcPath, err: error },
          `Error in tRPC handler on path '${trpcPath}'`,
        );
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
  });

  fastify.get('/', () => {
    return 'OK';
  });

  fastify.get('/health', () => {
    return { status: 'ok' };
  });

  await fastify.register(fastifyTRPCOpenApiPlugin, {
    basePath: '/api',
    router: appRouter,
    // trpc-to-openapi types its handler options loosely; it hands us the same
    // fastify request/reply pair as the tRPC plugin.
    createContext: (opts: unknown) =>
      createContext({ ...(opts as CreateFastifyContextOptions), auth, services }),
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
    if (!merged.tags.some((tag: { name?: string }) => tag.name === 'AI')) {
      merged.tags.push({ name: 'AI', description: 'AI Assistant endpoints' });
    }

    reply.header('Content-Type', 'application/json').send(merged);
  });

  await fastify.register(ScalarApiReference, {
    routePrefix: '/reference',
    configuration: {
      url: '/openapi.json',
      title: `Corevia tRPC API`,
      layout: 'modern',
      theme: 'purple',
      darkMode: true,
    },
  });

  return fastify;
}
