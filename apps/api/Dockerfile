FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

# Copy all workspace manifests so pnpm can resolve the workspace graph
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json      apps/api/
COPY apps/client/package.json   apps/client/
COPY apps/mobile/package.json   apps/mobile/
COPY packages/types/package.json packages/types/
COPY db/package.json            db/

RUN pnpm install --frozen-lockfile

# Copy only the source files needed to build the API
COPY packages/types/src         packages/types/src
COPY apps/api/src               apps/api/src
COPY apps/api/tsconfig.json     apps/api/

RUN pnpm --filter @camshare/api build

# Create a self-contained production bundle (prod deps only)
RUN pnpm deploy --filter @camshare/api --prod /deploy
# dist/ is gitignored so pnpm deploy won't include it — copy manually
RUN cp -r apps/api/dist /deploy/dist

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=builder /deploy .
EXPOSE 3001
CMD ["node", "dist/index.js"]
