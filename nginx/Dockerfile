FROM node:22-alpine AS client-builder
WORKDIR /app
RUN corepack enable

# Copy all workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json   apps/client/
COPY apps/api/package.json      apps/api/
COPY apps/mobile/package.json   apps/mobile/
COPY packages/types/package.json packages/types/
COPY db/package.json            db/

RUN pnpm install --frozen-lockfile --filter @camshare/client...

COPY packages/types/src         packages/types/src
COPY apps/client                apps/client

ARG VITE_API_URL=https://camshare.uplisoft.com/api
ARG VITE_SOCKET_URL=https://camshare.uplisoft.com

RUN VITE_API_URL=$VITE_API_URL VITE_SOCKET_URL=$VITE_SOCKET_URL \
    pnpm --filter @camshare/client build

FROM nginx:alpine
COPY --from=client-builder /app/apps/client/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
