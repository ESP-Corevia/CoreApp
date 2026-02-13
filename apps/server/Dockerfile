FROM node:24.13.1-alpine AS base

RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app


# -------------------------
# Builder (generate pruned monorepo)
# -------------------------
FROM base AS builder

# RUN corepack enable
# RUN corepack prepare yarn@4.9.2 --activate

# Install Turbo globally ONLY in builder
RUN npm install -g turbo


WORKDIR /app

COPY . .

# Prune everything except the server workspace
RUN turbo prune server --docker


# -------------------------
# Installer (install deps + build)
# -------------------------
FROM base AS installer

RUN corepack enable
RUN corepack prepare yarn@4.9.2 --activate

WORKDIR /app

# Load pruned package.json + lockfile + yarn metadata
COPY --from=builder /app/out/json/ ./

# Install only the pruned dependencies
RUN yarn install --immutable

# Copy full pruned workspace
COPY --from=builder /app/out/full/ ./

# Turbo prune strips non-package.json files (tsconfig*, etc.)
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.base.json ./tsconfig.base.json
COPY tsconfig.* ./

# Build the server app with Turbo
RUN yarn turbo -F server build


# -------------------------
# SERVER RUNTIME IMAGE (separate)
# -------------------------
FROM base AS server

RUN corepack enable
RUN corepack prepare yarn@4.9.2 --activate

# Create non-root user
RUN addgroup --system --gid 1001 expressjs \
    && adduser  --system --uid 1001 expressjs

USER expressjs

WORKDIR /app

# Copy compiled & pruned project
COPY --from=installer /app ./

# Move into server workspace
WORKDIR /app/apps/server

# Run start
CMD ["yarn","start"]

# -------------------------
# SEED RUNTIME IMAGE (separate)
# -------------------------
FROM base AS seed

RUN corepack enable
RUN corepack prepare yarn@4.9.2 --activate 

WORKDIR /app

COPY --from=installer /app ./

WORKDIR /app/apps/server
CMD ["yarn", "db:seed"]

# -------------------------
# MIGRATE RUNTIME IMAGE (separate)
# -------------------------
FROM base AS migrate

RUN corepack enable
RUN corepack prepare yarn@4.9.2 --activate 

WORKDIR /app

COPY --from=installer /app ./

WORKDIR /app/apps/server
CMD ["yarn", "db:migrate"]