# Environment reference

Environment values are loaded from the process environment. The server validates
its runtime configuration in `apps/server/src/env.ts`; Docker Compose adds a
small set of orchestration values. Use placeholders locally and never commit
real credentials.

## Files and precedence

| File | Scope | Use |
| --- | --- | --- |
| `.env.template` | Docker Compose/root | Starting point for the local stack |
| `apps/server/.env.example` | API process | Server-specific example variables |
| `apps/web/.env.example` | Back-office build/dev | Vite API URL |
| `apps/corevia-app/.env.example` | Patient/doctor build/dev | Vite API URL |
| `apps/home/.env.example` | Landing build/dev | Back-office URL |

The root `.env` is consumed by Docker Compose. Vite values are build-time values
and are exposed to browser code, so they must not contain secrets. Server secrets
must remain server-side.

## Server runtime

The following values are validated by `apps/server/src/env.ts`:

| Variable | Required | Default/meaning |
| --- | --- | --- |
| `NODE_ENV` | No | `production`; also supports `development`, `test` and `preview` |
| `PORT` | No | `3000` |
| `DATABASE_URL` | No | Local PostgreSQL URL; override for Docker or hosted PostgreSQL |
| `DB_POOL_MAX` | No | `10` connections |
| `DB_IDLE_TIMEOUT_MS` | No | `30000` |
| `DB_CONNECTION_TIMEOUT_MS` | No | `10000` |
| `BASE_URL` | No | `http://localhost:3000`; used in generated API metadata |
| `SESSION_SECRET` | Yes | Session signing secret |
| `CORS_ORIGIN` | No | `http://localhost:5173` |
| `BETTER_AUTH_SECRET` | Yes | Better Auth signing secret |
| `BETTER_AUTH_URL` | No | `http://localhost:3000` |
| `LOG_LEVEL` | No | `info` |
| `SEED_ADMIN_EMAIL` | No | Seed-only administrator identity |
| `SEED_ADMIN_PASSWORD` | No | Seed-only password; override it outside disposable local data |
| `API_MEDICAMENTS_URL` | No | External medication API URL |
| `API_MEDICAMENTS_TIMEOUT` | No | `5000` ms |
| `API_MEDICAMENTS_CACHE_TTL` | No | `900000` ms |
| `NVIDIA_API_KEY` | Yes | Credential for the configured NVIDIA AI provider |
| `S3_ENDPOINT` | No | `http://localhost:9000` for local MinIO |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | No | Local MinIO-compatible credentials |
| `S3_BUCKET_NAME` | No | `corevia` |
| `S3_REGION` | No | `us-east-1` |
| `S3_FORCE_PATH_STYLE` | No | `true`, suitable for local MinIO |

## Docker Compose values

Compose requires `DATABASE_URL`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET` and
`SESSION_SECRET` for the core stack. It provides defaults for `POSTGRES_DB`
(`Corevia`), `POSTGRES_USER` (`postgres`), `CORS_ORIGIN`, `BETTER_AUTH_URL`, and
the MinIO credentials/ports. The `tools` profile additionally requires
`MASTERPASS` for the Drizzle gateway. `S3_BUCKET_NAME` defaults to `corevia` in
the bucket creation service.

The documented local hostnames are:

| Host | Role |
| --- | --- |
| `home.corevia.local` | Landing page |
| `back-office.corevia.local` | Back-office |
| `app.corevia.local` | Patient/doctor application |
| `api.corevia.local` | API and Scalar reference |

These `.corevia.local` names are local development domains backed by mkcert and
the hosts file. They are not a claim about every production hostname.

## Frontend build-time values

| Variable | Workspace | Purpose |
| --- | --- | --- |
| `VITE_SERVER_URL` | `apps/web`, `apps/corevia-app` | API base URL used by the browser clients |
| `VITE_BACKOFFICE_DOMAIN` | `apps/home` | Back-office URL linked from the landing page |

In Docker, these values are passed as image build arguments. In local Vite
development, the API proxy targets `http://127.0.0.1:3000`, or HTTPS when local
certificates are present.

## Safe setup

1. Copy `.env.template` to `.env` for the Docker stack and replace every secret
   placeholder.
2. Copy the relevant workspace `.env.example` file when running an application
   directly.
3. Use long, unique secrets for `SESSION_SECRET` and `BETTER_AUTH_SECRET`.
4. Run `pnpm --filter web verify-env` when checking the back-office environment.
5. Do not paste `.env` contents into issues, logs or documentation.
