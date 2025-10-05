import fastifyCors from '@fastify/cors';
import ScalarApiReference from '@scalar/fastify-api-reference';
import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';
import { fastifyTRPCOpenApiPlugin, generateOpenApiDocument } from 'trpc-to-openapi';

import pkg from '../package.json' assert { type: 'json' };

import { env } from './env';
import { auth } from './lib/auth';
import printBanner from './lib/banner';
import { createContext } from './lib/context';
import { appRouter, type AppRouter } from './routers/index';
import { mergeOpenApiDocs } from './utils/functions';
const baseCorsConfig = {
  origin: [env.CORS_ORIGIN, 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key', 'x-language'],
  maxAge: 86400,
  exposedHeaders: ['Set-Cookie'],
};

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'HH:MM:ss Z',
      },
    },
  },
});

fastify.register(fastifyCors, baseCorsConfig);

fastify.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
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
      response.headers.forEach((value, key) => reply.header(key, value));
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

fastify.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext: (opts) => createContext({ ...opts, auth }),
    onError({ path, error }) {
      fastify.log.error({ path, err: error }, `Error in tRPC handler on path '${path}'`);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

fastify.get('/', () => {
  return 'OK';
});
fastify.register(fastifyTRPCOpenApiPlugin, {
  basePath: '/api',
  router: appRouter,
  createContext: () => ({ auth }),
});
fastify.get('/openapi.json', async (_req, reply) => {
  const trpcDoc = generateOpenApiDocument(appRouter, {
    title: 'Corevia tRPC API',
    version: pkg.version,
    baseUrl: env.BASE_URL + '/api',
  });
  const authDoc = await auth.api.generateOpenAPISchema();
  const merged = mergeOpenApiDocs(trpcDoc, authDoc);

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
fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  const addr = fastify.server.address();
  const url =
    addr && typeof addr === 'object'
      ? `http://${addr.address}:${addr.port}`
      : 'http://localhost:3000';
  printBanner('CoreviaBackend', `Corevia API listening at ${url}`);

  fastify.log.info('Server running on port 3000');
});
