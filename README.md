# Corevia

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, React Router, Fastify, TRPC, and more.

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

First, install the dependencies:

```bash
yarn
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
yarn db:migrate
```

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

API reference (Swagger/OpenAPI): the backend exposes a web UI for the API reference at /api/auth/reference — for a local dev server open:

```
http://localhost:3000/api/auth/reference
```

## Project Structure

```
Corevia/
├── apps/
│   ├── web/         # Frontend application (React + React Router)
│   └── server/      # Backend API (Fastify, TRPC)
```

## Available Scripts

- `yarn dev`: Start all applications in development mode
- `yarn build`: Build all applications
- `yarn dev:web`: Start only the web application
- `yarn dev:server`: Start only the server
- `yarn check-types`: Check TypeScript types across all apps
- `yarn db:push`: Push schema changes to database
- `yarn db:studio`: Open database studio UI
