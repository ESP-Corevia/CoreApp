# Corevia

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, React Router, Fastify, TRPC, and more.

[![🎨 Frontend CI (Web)](https://github.com/ESP-Corevia/CoreApp/actions/workflows/web.yml/badge.svg)](https://github.com/ESP-Corevia/CoreApp/actions/workflows/web.yml)
[![🧩 Backend CI (Server)](https://github.com/ESP-Corevia/CoreApp/actions/workflows/server.yml/badge.svg)](https://github.com/ESP-Corevia/CoreApp/actions/workflows/server.yml)
[![Build and Push Web Docker Image to DigitalOcean](https://github.com/ESP-Corevia/CoreApp/actions/workflows/deployment_web.yml/badge.svg)](https://github.com/ESP-Corevia/CoreApp/actions/workflows/deployment_web.yml)
[![Build and Push Docker Server Image to DigitalOcean](https://github.com/ESP-Corevia/CoreApp/actions/workflows/deployment_server.yml/badge.svg)](https://github.com/ESP-Corevia/CoreApp/actions/workflows/deployment_server.yml)

## Features

- **TypeScript** - For type safety and improved developer experience
- **React Router** - Declarative routing for React
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Fastify** - Fast, low-overhead web framework
- **tRPC** - End-to-end type-safe APIs
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Email & password authentication with Better Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ^20.19.0 or >=22.12.0
- [pnpm](https://pnpm.io/) 10.12.1
- [Docker](https://www.docker.com/) & Docker Compose
- [mkcert](https://github.com/FiloSottile/mkcert) (for local HTTPS)

### Local Development

```bash
pnpm install
pnpm dev              # Start all apps
pnpm dev:backoffice   # Start web + server
```

### Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up (or use Docker, see below).
2. Update your `apps/server/.env` file with your PostgreSQL connection details.
3. Apply the schema:

```bash
pnpm db:migrate
```

## Docker

### 1. Setup SSL Certificates (one-time, development only)

> In production, use real certificates from a CA (e.g., Let's Encrypt). mkcert is for local development only.

#### Windows

```powershell
# Install mkcert
scoop bucket add extras
scoop install mkcert
# or: choco install mkcert

# Install the local CA (auto-trusts in Windows & browsers)
mkcert -install

# Add custom domains to hosts file (run as Administrator)
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value @"
127.0.0.1 back-office.corevia.local
127.0.0.1 api.corevia.local
"@
```

#### Linux / macOS

```bash
# Install mkcert
# Ubuntu/Debian: sudo apt install mkcert
# macOS: brew install mkcert

# Install the local CA
mkcert -install

# Add custom domains to hosts file
echo "127.0.0.1 back-office.corevia.local" | sudo tee -a /etc/hosts
echo "127.0.0.1 api.corevia.local" | sudo tee -a /etc/hosts
```

#### Generate Certificates (all platforms)

From the project root:

```bash
mkdir -p certs
mkcert -cert-file certs/cert.pem -key-file certs/key.pem \
  back-office.corevia.local api.corevia.local localhost 127.0.0.1
```

### 2. Configure Environment

Copy and fill in the `.env` file at the project root:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `BETTER_AUTH_SECRET` | Auth signing secret (min 32 chars) |
| `SESSION_SECRET` | Session signing secret |
| `CORS_ORIGIN` | Allowed CORS origin (`https://back-office.corevia.local`) |
| `MASTERPASS` | Drizzle Studio gateway password |

### 3. Run

```bash
# Full stack (postgres + server + web + SSL proxy)
docker compose --profile web up --build

# Server only (postgres + server)
docker compose --profile server up --build

# Database seed (runs migrations first, then seeds)
docker compose --profile seed up seed --build

# Run migrations only
docker compose up migrate --build

# Stop all services
docker compose --profile web down

# Stop and remove volumes (reset database)
docker compose --profile web down -v

# Rebuild a single service
docker compose --profile web up --build server

# View logs for a specific service
docker compose logs -f server
```

### 4. Access

| Service | URL |
|---------|-----|
| Back-office | https://back-office.corevia.local |
| API | https://api.corevia.local |
| API reference | https://api.corevia.local/reference |
| Drizzle Studio | http://localhost:4983 |
| PostgreSQL | localhost:5432 |

### Docker Architecture

```
                    ┌─────────────────┐
                    │   nginx proxy   │
                    │   :80 / :443    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │ back-office. │ api.          │
              │ corevia.local│ corevia.local │
              ▼              ▼               │
        ┌───────────┐ ┌───────────┐         │
        │ web(nginx) │ │  server   │         │
        │   :8080    │ │  :3000    │         │
        └───────────┘ └─────┬─────┘         │
                            │               │
                      ┌─────▼─────┐         │
                      │ postgres  │         │
                      │  :5432    │         │
                      └───────────┘         │
```

### Docker Profiles

| Profile | Services started |
|---------|-----------------|
| `web` | postgres, migrate, server, web, proxy |
| `server` | postgres, migrate, server |
| `seed` | postgres, migrate, seed |

## Project Structure

```
Corevia/
├── apps/
│   ├── web/         # Frontend application (React + React Router)
│   ├── server/      # Backend API (Fastify, tRPC)
│   └── home/        # Landing page
├── proxy/           # Nginx reverse proxy config (SSL termination)
├── certs/           # mkcert SSL certificates (gitignored)
└── docker-compose.yml
```

## Available Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications
- `pnpm dev:web` - Start only the web application
- `pnpm dev:server` - Start only the server
- `pnpm dev:backoffice` - Start web + server together
- `pnpm check-types` - Check TypeScript types across all apps
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed the database
- `pnpm db:studio` - Open database studio UI
