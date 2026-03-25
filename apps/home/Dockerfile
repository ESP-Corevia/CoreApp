FROM node:24.13.1-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---
FROM base AS prepare
RUN npm install -g turbo
COPY . .
RUN turbo prune home --docker

# ---
FROM base AS builder

ARG VITE_BACKOFFICE_DOMAIN
ENV VITE_BACKOFFICE_DOMAIN=$VITE_BACKOFFICE_DOMAIN

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=prepare /app/out/full/ .
COPY tsconfig.* ./

RUN pnpm turbo -F home build


# ---
FROM nginx:stable-alpine-slim

# Non-root user setup
RUN addgroup --system --gid 1001 appgroup \
    && adduser --system --uid 1001 appuser \
    && chown -R appuser:appgroup /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid

# SPA routing + security headers config
COPY apps/home/nginx.conf /etc/nginx/conf.d/default.conf

USER appuser

WORKDIR /usr/share/nginx/html

COPY --from=builder --chown=appuser:appgroup /app/apps/home/build/client ./

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
