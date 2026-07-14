# Mercury: Financials production image.
#
#   docker build -t mercury-financials .
#
# An ordinary single-context build: @cardano-mercury/core comes from npm, so nothing outside this
# repo is needed. (It used to require the parent directory as context, because core was a
# `file:../mercury-core` link that npm could not resolve from within a build context.)

FROM node:25-alpine AS base
WORKDIR /app


FROM base AS builder

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# Migration stage. Run as a one-shot before the app starts. This applies ONLY financials' own
# financials_* tables; the shared auth tables belong to core and are applied by
# `npx mercury-core migrate`, which must run first (see docs/deployment.md, and note that tokenomics
# foreign-keys to "user").
#
# Built from scratch rather than from `builder`, and it carries none of the app's dependencies. It
# needs three packages and the committed SQL, nothing else: not @meshsdk/core, not the Svelte
# toolchain, not the app source. `builder` would work and would be one line, but it lands ~570 MB of
# dev toolchain on the production host to run a query that takes two seconds. This is ~150 MB.
#
# The versions are lifted from package.json so this cannot silently drift from the drizzle-kit the
# migrations were generated with.
FROM base AS migrate

ENV NODE_ENV=production

# Generate a fresh, minimal manifest rather than reusing the app's. `npm install` installs whatever
# is declared in the package.json it finds, so copying the app's manifest here drags in the entire
# runtime tree (@meshsdk, @cardano-sdk, lucide) that a migration has no use for.
COPY package.json /tmp/app-package.json
RUN node -e "\
	const d = require('/tmp/app-package.json').devDependencies; \
	const pick = ['drizzle-kit', 'drizzle-orm', 'postgres']; \
	const deps = Object.fromEntries(pick.map((n) => [n, d[n]])); \
	for (const [n, v] of Object.entries(deps)) if (!v) throw new Error('missing devDependency: ' + n); \
	require('fs').writeFileSync('package.json', JSON.stringify( \
		{ name: 'financials-migrate', private: true, type: 'module', dependencies: deps }, null, 2)); \
	" \
	&& npm install --no-audit --no-fund \
	&& npm cache clean --force

# drizzle.config.ts reads DATABASE_URL and points at ./drizzle. It also names the schema file, but
# `migrate` only applies the committed SQL and never reads the schema, so the app source is not
# needed here.
COPY drizzle.config.ts ./
COPY drizzle ./drizzle

CMD ["npx", "drizzle-kit", "migrate"]


# Runtime: production dependencies plus the built server.
FROM base AS runner

ENV NODE_ENV=production

# adapter-node externalises anything in `dependencies`, so those must be present at runtime;
# `devDependencies` (drizzle-orm, postgres, svelte) are bundled into build/ and are not needed.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/build ./build

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
