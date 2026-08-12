# Frontend image, built from the REPO ROOT.
#
# Everything Railway needs — this file, railway.json, .dockerignore — sits at
# the root and reaches down into Frontend/ itself. No Root Directory setting,
# so there is no second place for a path to be resolved from and nothing to
# double-apply.
#
# NEXT_PUBLIC_* are inlined into the client bundle at BUILD time, not read at
# runtime, so they arrive as build args. Anything without that prefix
# (API_INTERNAL_URL, the auth cookies) is read at runtime, server-side only,
# and must not be baked in.

# ---- deps -----------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Lockfile first, so a source-only change reuses this layer.
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY Frontend/ ./

ENV NEXT_TELEMETRY_DISABLED=1

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

# `output: "standalone"` emits a server carrying only the packages actually
# reached, so node_modules never ships whole.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# node:alpine already ships an unprivileged `node` user (uid 1000).
USER node

# Railway injects PORT. HOSTNAME must be 0.0.0.0 or the server binds loopback
# and the healthcheck can never reach it.
ENV PORT=3000 \
    HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "server.js"]
