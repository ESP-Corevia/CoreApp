import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";

import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { createContext } from "./lib/context";
import { appRouter, type AppRouter } from "./routers/index";
import {
  fastifyTRPCOpenApiPlugin,
  generateOpenApiDocument,
} from "trpc-to-openapi";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { auth } from "./lib/auth";
import pkg from "../package.json" assert { type: "json" };
const baseCorsConfig = {
  origin: process.env.CORS_ORIGIN || "",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
};

const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: "HH:MM:ss Z",
      },
    },
  },
});

fastify.register(fastifyCors, baseCorsConfig);

fastify.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
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
      fastify.log.error({ err: error }, "Authentication Error:");
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

fastify.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      fastify.log.error(
        { path, err: error },
        `Error in tRPC handler on path '${path}'`
      );
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

fastify.get("/", async () => {
  return "OK";
});
await fastify.register(fastifyTRPCOpenApiPlugin, {
  basePath: "/api",
  router: appRouter,
  createContext,
});
fastify.get("/openapi.json", (_req, reply) => {
  const openApiDoc = generateOpenApiDocument(appRouter, {
    title: "My APIs",
    version: pkg.version,
    baseUrl: "http://localhost:3000/api",
    securitySchemes: {
      apiKeyHeader: {
        description: "API key required for access",
        type: "apiKey",
        name: "X-API-KEY",
        in: "header",
      },
    },
  });

  reply.header("Content-Type", "application/json").send(openApiDoc);
});

await fastify.register(ScalarApiReference, {
  routePrefix: "/reference",
  configuration: {
    url: "/openapi.json",
    title: `Corevia tRPC API`,
    layout: "modern",
    theme: "purple",
    darkMode: true,
  },
});
fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info("Server running on port 3000");
});
