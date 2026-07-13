# Mercury: Financials production image.
#
# IMPORTANT: the build context is the PARENT directory that holds both repos, not this one:
#
#   docker build -f mercury-financials/Dockerfile -t mercury-financials ~/cardano-mercury
#
# That is not a preference, it is forced: package.json depends on core as
# "@cardano-mercury/core": "file:../mercury-core", and a path outside the build context cannot be
# resolved, so `npm ci` fails outright with this repo alone as the context. Once core is published
# to a registry (TRD: mercury-core/.claude/trds/CORE_PUBLISHABLE_FOR_DOCKER_BUILDS.md) this whole
# file collapses to an ordinary single-context build and the core stages below disappear.

FROM node:22-alpine AS base
WORKDIR /app


# Build stage: core first (financials links to its dist/), then the app.
FROM base AS builder

COPY mercury-core/package.json mercury-core/package-lock.json* ./mercury-core/
RUN cd mercury-core && npm ci

COPY mercury-core/ ./mercury-core/
RUN cd mercury-core && npm run build

COPY mercury-financials/package.json mercury-financials/package-lock.json ./mercury-financials/
RUN cd mercury-financials && npm ci

COPY mercury-financials/ ./mercury-financials/
RUN cd mercury-financials && npm run build


# Migration stage: keeps the dev dependencies, because drizzle-kit is one of them. Run this as a
# one-shot before starting the app; it is not the image that serves traffic.
#
#   docker run --rm -e DATABASE_URL=... mercury-financials-migrate
#
# Note this applies ONLY financials' own financials_* tables. The shared auth tables belong to core
# and must already exist (TRD: CORE_OWNS_AUTH_MIGRATIONS.md), otherwise tokenomics' foreign keys to
# "user" have nothing to point at.
FROM builder AS migrate
WORKDIR /app/mercury-financials
CMD ["npx", "drizzle-kit", "migrate"]


# Runtime: production dependencies only, plus the built server.
FROM base AS runner

ENV NODE_ENV=production

# adapter-node externalises anything listed in `dependencies`, so those must be present at runtime;
# `devDependencies` (drizzle-orm, postgres, svelte) are bundled into build/ and are not needed here.
COPY mercury-core/package.json ./mercury-core/package.json
COPY --from=builder /app/mercury-core/dist ./mercury-core/dist

COPY mercury-financials/package.json mercury-financials/package-lock.json ./mercury-financials/
RUN cd mercury-financials && npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/mercury-financials/build ./mercury-financials/build

WORKDIR /app/mercury-financials

# The Node server binds this; Caddy reaches it on the internal network, so it is never published.
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# Behind a TLS-terminating proxy, adapter-node needs to be told which headers carry the real
# protocol and host. Without these it builds absolute URLs as http://financials:3000, and Better
# Auth then rejects its own callbacks as cross-origin. This is the single most common way the
# proxied setup breaks, so it is baked in rather than left to the compose file.
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host

# Run unprivileged. The node image ships a `node` user for exactly this.
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "build"]
