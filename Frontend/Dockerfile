# Multi-stage build for the Next.js frontend.
#
# The build context is `Frontend/` — set Root Directory to `Frontend` on the
# Railway service, which is also where railway.json lives.
#
# The important subtlety here is NEXT_PUBLIC_*. Those are inlined into the
# client bundle at BUILD time, not read at runtime, so they have to be present
# as build args or the browser ships with whatever the defaults were. Anything
# without the prefix (API_INTERNAL_URL, the token cookies) is read at runtime
# on the server only, and must NOT be baked in.

# ---- deps -----------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Lockfile first, so a source-only change reuses this layer.
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Baked into the client bundle. Railway passes service variables of the same
# name as build args, so setting them on the service is enough.
ARG NEXT_PUBLIC_API_MODE=live
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_API_TIMEOUT_MS=15000
ENV NEXT_PUBLIC_API_MODE=${NEXT_PUBLIC_API_MODE} \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_API_TIMEOUT_MS=${NEXT_PUBLIC_API_TIMEOUT_MS}

RUN npm run build

# ---- runtime --------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# `output: "standalone"` emits a self-contained server with only the packages
# actually reached, so node_modules never ships whole.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Run unprivileged. node:alpine already ships a `node` user (uid 1000).
USER node

# Railway injects PORT; the standalone server reads it. HOSTNAME must be
# 0.0.0.0 or the server binds loopback and the healthcheck can never reach it.
ENV PORT=3000 \
    HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "server.js"]
