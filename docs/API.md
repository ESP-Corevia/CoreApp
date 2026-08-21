# API reference

The server exposes a Fastify HTTP API assembled in
`apps/server/src/app.ts`. The interactive API documentation is generated at
runtime and served through Scalar.

## Documentation endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/reference` | Scalar interactive API reference |
| `GET` | `/openapi.json` | Merged OpenAPI document consumed by Scalar and tooling |

The local URL is `http://localhost:3000/reference` (or the HTTPS/API hostname
from the [Docker access table](../README.md#4-access)). The frontend Vite
configurations proxy `/reference` and `/openapi.json` to the server.

## HTTP surfaces

| Path | Surface | Notes |
| --- | --- | --- |
| `/api` | OpenAPI-compatible tRPC procedures | Generated from `appRouter` and registered with `trpc-to-openapi` |
| `/trpc` | Native tRPC transport | Used by the typed frontend clients |
| `/api/auth/*` | Better Auth | Session and authentication operations |
| `/chat` | AI assistant | Authenticated SSE/UI-message stream |
| `/health` | Health probe | Returns `{ "status": "ok" }` |
| `/` | Liveness response | Returns `OK` |

The generated operation groups are derived from the registered tRPC routers. The
repository currently contains administrative, doctor, patient, user and AI
router areas; the exact operation list should be read from `/openapi.json` rather
than duplicated manually here.

## How the OpenAPI document is built

On each request to `/openapi.json`, the server:

1. generates the OpenAPI document for `appRouter`;
2. asks Better Auth for its OpenAPI schema;
3. merges both documents and de-duplicates operation IDs;
4. adds the manually registered `/chat` operation;
5. returns the resulting JSON document.

This means API documentation for tRPC and Better Auth follows the registered
router/auth code at runtime. The AI route is registered outside tRPC and is
therefore added explicitly to the merged document.

## Validation and authentication

Request schemas are defined by the tRPC procedures and Zod/OpenAPI metadata. Use
the schemas in `/openapi.json` as the authoritative request and response shape.
Protected operations require the authenticated Better Auth session cookie; the
`/chat` operation is also documented with cookie authentication. The server
configures CORS with credentials enabled for the allowed application origins.

When diagnosing an API failure, check the HTTP status and response body first,
then inspect the server log for the tRPC path. Authentication failures on the
Better Auth adapter are returned as an internal authentication error with code
`AUTH_FAILURE`; other procedure errors are handled by the tRPC/Fastify adapters.

## Local verification

Start the API with `pnpm dev:server`, then open:

```text
http://localhost:3000/reference
http://localhost:3000/openapi.json
```

For the Docker stack, use `https://api.corevia.local/reference` after generating
the local certificates and hosts entries described in the README.
