FROM node:24.13.1-alpine AS base

RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app


# -------------------------
# Builder (generate pruned monorepo)
# -------------------------
FROM base AS builder

RUN npm install -g turbo

WORKDIR /app

COPY . .

RUN turbo prune server --docker


# -------------------------
# pnpm-base (shared corepack setup)
# -------------------------
FROM base AS pnpm-base

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate


# -------------------------
# Installer (install deps + build)
# -------------------------
FROM pnpm-base AS installer

WORKDIR /app

COPY --from=builder /app/out/json/ ./

RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ ./

COPY tsconfig.* ./

RUN pnpm turbo -F server build


# -------------------------
# SERVER RUNTIME IMAGE
# -------------------------
FROM pnpm-base AS server

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 expressjs \
    && adduser  --system --uid 1001 expressjs

USER expressjs

WORKDIR /app

COPY --from=installer --chown=expressjs:expressjs /app ./

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["node","dist/index.js"]


# -------------------------
# SEED RUNTIME IMAGE
# -------------------------
FROM pnpm-base AS seed

WORKDIR /app

COPY --from=installer /app ./

WORKDIR /app/apps/server
CMD ["pnpm", "db:seed"]


# -------------------------
# MIGRATE RUNTIME IMAGE
# -------------------------
FROM pnpm-base AS migrate

WORKDIR /app

COPY --from=installer /app ./

WORKDIR /app/apps/server
CMD ["pnpm", "db:migrate"]
