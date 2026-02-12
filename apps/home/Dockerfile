FROM node:24.13.1-alpine AS base

# This Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update both files!

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app

# ---
FROM base AS prepare
RUN npm install -g turbo
COPY . .
# Add lockfile and package.json's of isolated subworkspace
RUN turbo prune home --docker

# ---
FROM base AS builder

RUN corepack enable
RUN corepack prepare yarn@4.9.2 --activate
WORKDIR /app
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .

RUN yarn install
# Build the project
COPY --from=prepare /app/out/full/ .

COPY tsconfig.json ./tsconfig.json
COPY tsconfig.base.json ./tsconfig.base.json
COPY tsconfig.* ./
# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN yarn turbo -F home build




FROM nginx:stable-alpine-slim

# # Don't run production as root for security reasons
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs
# USER nextjs

WORKDIR /usr/share/nginx/html
# Automatically leverage output traces to reduce image size
COPY --from=builder /app/apps/home/build/client ./

CMD ["nginx", "-g", "daemon off;"]
