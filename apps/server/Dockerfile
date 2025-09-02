FROM node:20.19-bullseye-slim AS builder

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN corepack enable
RUN yarn install

COPY . .

RUN yarn build

RUN yarn workspaces focus --production

FROM node:20.19-bullseye-slim

WORKDIR /app

ENV NODE_ENV=production
USER node

COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/.yarn ./.yarn
COPY --chown=node:node --from=builder /app/.pnp.cjs ./.pnp.cjs

CMD ["yarn", "start"]