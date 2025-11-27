FROM node:24.11-bullseye-slim AS builder

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN corepack enable
RUN yarn install

COPY . .
COPY tsconfig.prod.json tsconfig.json

RUN yarn build

FROM nginx:stable-alpine-slim

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/build/client ./

CMD ["nginx", "-g", "daemon off;"]
