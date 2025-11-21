FROM node:24.11-bullseye-slim AS builder

ENV NODE_ENV=production

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY ./apps/server/package.json ./apps/server/
COPY turbo.json .
COPY .yarnrc.yml ./.yarnrc.yml

RUN corepack enable
RUN yarn install

COPY ./apps/server ./apps/server

RUN yarn build

FROM node:24.11-bullseye-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --chown=node:node --from=builder /app/apps/server/dist ./dist

COPY --chown=node:node --from=builder /app/apps/server/package*.json ./
COPY --chown=node:node --from=builder /app/yarn.lock ./
COPY --chown=node:node --from=builder /app/.yarn ./.yarn
COPY --chown=node:node --from=builder /app/.yarnrc.yml ./.yarnrc.yml

RUN corepack enable
RUN yarn workspaces focus --production
USER node

CMD ["yarn", "start"]