import 'dotenv/config';
import fastifyCors from '@fastify/cors';
import ScalarApiReference from '@scalar/fastify-api-reference';
import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';
import { fastifyTRPCOpenApiPlugin, generateOpenApiDocument } from 'trpc-to-openapi';

import pkg from '../package.json' assert { type: 'json' };

import { auth } from './lib/auth';
import printBanner from './lib/banner';
import { createContext } from './lib/context';
import { appRouter, type AppRouter } from './routers/index';
function mergeOpenApiDocs(a: any, b: any) {
  const servers = [
    { url: '/api' }, // tRPC
    { url: '/api/auth' }, // Better Auth
  ];
  const merged = {
    openapi: a.openapi || b.openapi || '3.0.3',
    info: {
      title: 'Corevia API',
      version: pkg.version,
      description: 'Schéma OpenAPI fusionné (tRPC + Better Auth).',
    },
    servers,
    tags: [...new Map([...(a.tags ?? []), ...(b.tags ?? [])].map((t) => [t.name, t])).values()],
    paths: { ...(a.paths ?? {}), ...(b.paths ?? {}) },
    components: {
      schemas: {
        ...(a.components?.schemas ?? {}),
        ...(b.components?.schemas ?? {}),
      },
      securitySchemes: {
        ...(a.components?.securitySchemes ?? {}),
        ...(b.components?.securitySchemes ?? {}),
      },
      parameters: {
        ...(a.components?.parameters ?? {}),
        ...(b.components?.parameters ?? {}),
      },
      requestBodies: {
        ...(a.components?.requestBodies ?? {}),
        ...(b.components?.requestBodies ?? {}),
      },
      responses: {
        ...(a.components?.responses ?? {}),
        ...(b.components?.responses ?? {}),
      },
      headers: {
        ...(a.components?.headers ?? {}),
        ...(b.components?.headers ?? {}),
      },
      examples: {
        ...(a.components?.examples ?? {}),
        ...(b.components?.examples ?? {}),
      },
      links: { ...(a.components?.links ?? {}), ...(b.components?.links ?? {}) },
      callbacks: {
        ...(a.components?.callbacks ?? {}),
        ...(b.components?.callbacks ?? {}),
      },
    },
    security: a.security ?? b.security ?? [],
    externalDocs: a.externalDocs ?? b.externalDocs,
  };

  const seen = new Set<string>();
  // eslint-disable-next-line ts/no-unused-vars
  for (const [p, methods] of Object.entries<any>(merged.paths)) {
    // eslint-disable-next-line ts/no-unused-vars
    for (const [m, op] of Object.entries<any>(methods)) {
      if (!op || typeof op !== 'object') continue;
      if (op.operationId) {
        let id = op.operationId as string;
        if (seen.has(id)) {
          op.operationId = `auth:${id}`;
        }
        seen.add(op.operationId);
      }
    }
  }

  return merged;
}

const baseCorsConfig = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
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
    createContext,
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
  createContext,
});
fastify.get('/openapi.json', async (_req, reply) => {
  //TODO: add env BASE_URL
  const trpcDoc = generateOpenApiDocument(appRouter, {
    title: 'Corevia tRPC API',
    version: pkg.version,
    baseUrl: 'http://localhost:3000/api',
    securitySchemes: {
      apiKeyHeader: {
        description: 'API key for selected routes',
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
      },
    },
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
