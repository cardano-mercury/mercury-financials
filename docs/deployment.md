# Deploying Mercury: Financials

Financials runs as a Node server (SvelteKit's `adapter-node`) behind a reverse proxy, against a
Postgres database it shares with the other Mercury apps and a Redis it uses for the Blockfrost
ingestion queue.

This document covers financials specifically. The stack that runs financials and tokenomics
together on one machine (Caddy, Postgres, Redis, both apps) lives in mercury-core under `deploy/`.

## The shared database is the thing to understand first

One Postgres serves every Mercury app, and each app is only allowed to touch its own tables:

| Owner        | Tables                                                     | Migrations run by |
| ------------ | ---------------------------------------------------------- | ----------------- |
| mercury-core | `user`, `session`, `account`, `verification`, `two_factor` | core              |
| financials   | `financials_*`                                             | financials        |
| tokenomics   | `tokenomics_*`                                             | tokenomics        |

Each app keeps its own drizzle journal (`__drizzle_migrations_financials`,
`__drizzle_migrations_tokenomics`), so three migration histories coexist without overwriting each
other.

**Migration order is load-bearing.** The shared auth tables must exist before either app migrates,
because tokenomics foreign-keys to `user`. Run them in this order, always:

1. The shared auth tables (core's job)
2. Financials' own migrations
3. Tokenomics' own migrations

**Never run `drizzle-kit push` against the shared database.** There is deliberately no `db:push`
script. `tablesFilter` does not cover sequences, so push from financials proposes
`DROP SEQUENCE __drizzle_migrations_tokenomics_id_seq` and would destroy tokenomics' migration
history. Use `db:generate` and `db:migrate`, which only apply committed SQL.

### Applying the shared auth tables

Core ships them and owns their migrations:

```sh
npx mercury-core migrate      # or: npm run db:auth
```

It takes a Postgres advisory lock, so two app containers racing each other at boot is safe, and it
is idempotent. If the database already has `user`/`session`/`account`/`verification`/`two_factor`
from before core owned them, it refuses to guess and tells you to run:

```sh
npx mercury-core migrate --baseline   # adopt the existing tables without altering them
```

### Moving an older database across

A database created before the tables were prefixed keeps its data through the rename:

```sh
psql "$DATABASE_URL" -f drizzle/manual/rename-to-financials-prefix.sql
```

It renames the tables, indexes, and constraints, is idempotent, and does not touch row data. Fresh
databases do not need it.

## Environment

| Variable                         | Required       | Notes                                                                                                                                                                                                 |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | yes            | The shared Postgres.                                                                                                                                                                                  |
| `REDIS_URL`                      | yes            | BullMQ ingestion queue. Financials is the only app that uses Redis.                                                                                                                                   |
| `BETTER_AUTH_SECRET`             | yes            | **Must be byte-identical across every Mercury app**, or a session minted by one is rejected by the others with no useful error. `openssl rand -base64 32`.                                            |
| `ORIGIN`                         | yes            | The public https URL, e.g. `https://demo-financials.cardano-mercury.com`.                                                                                                                             |
| `COOKIE_DOMAIN`                  | prod           | Set to `.cardano-mercury.com` for SSO across the Mercury subdomains. Leave unset for a standalone instance.                                                                                           |
| `BLOCKFROST_PROJECT_ID`          | yes            | Ingestion fails without it.                                                                                                                                                                           |
| `BLOCKFROST_NETWORK`             | yes            | `mainnet`, `preview`, or `preprod`.                                                                                                                                                                   |
| `SINGLE_USER_MODE`               | no             | Default `true`: the first sign-up claims the instance, then sign-ups close. Set `false` for an open instance.                                                                                         |
| `DEMO_MODE`                      | no             | Default `false`. See below.                                                                                                                                                                           |
| `PORT`, `HOST`                   | no             | Default `3000` / `0.0.0.0` in the image.                                                                                                                                                              |
| `PROTOCOL_HEADER`, `HOST_HEADER` | behind a proxy | Baked into the image as `x-forwarded-proto` / `x-forwarded-host`. Without them adapter-node builds absolute URLs from the internal address and Better Auth rejects its own callbacks as cross-origin. |

## The public demo

`DEMO_MODE=true` serves `/demo`: an unauthenticated, read-only view of the instance's Trial
Balance, Balance Sheet, and P&L, plus their CSV exports and the transaction register. An anonymous
visitor hitting `/` is sent there rather than to the login page, which is what makes
`demo-financials.cardano-mercury.com` behave like a demo instead of a locked door.

It is read-only by construction: the demo routes define no form actions, and every write path still
sits behind the session check. The signed-in `/export` endpoint keeps returning 401 to anonymous
callers.

**Leave it `false` on a private instance.** It publishes that instance's books.

Seed the demo before sharing the link, or reviewers land on empty statements: sign in, add a wallet,
let the Blockfrost sync finish (it pages through history in the background), categorise anything
that matters, and set the entity name under Settings. A fresh instance shows "Your Entity" until you
do.

## Images

CI publishes two images to GHCR, so the deploy host never builds anything:

| image                                                | Dockerfile target | size   |
| ---------------------------------------------------- | ----------------- | ------ |
| `ghcr.io/cardano-mercury/mercury-financials`         | `runner`          | 433 MB |
| `ghcr.io/cardano-mercury/mercury-financials-migrate` | `migrate`         | 219 MB |

Two, not one, because the runner is installed with `npm ci --omit=dev` and `drizzle-kit` is a
devDependency, so the runner cannot migrate. The stack runs the migrate image as a one-shot before
the app starts.

The migrate image is built from scratch rather than from the build stage, and carries only
`drizzle-kit`, `drizzle-orm`, `postgres` and the committed SQL. Reusing the build stage would be one
line, but it lands a full dev toolchain (~570 MB) on the production host to run a query that takes
two seconds.

`.github/workflows/release.yml` runs the whole gate (lint, check, test, build) before it pushes, and
audits the pushed image for a baked-in `.env`. A `v*` tag cuts a release and moves `latest`; pushes
to `main` refresh a rolling `main` tag. Every image also gets a `sha-<short>` tag so a deploy can be
pinned to an exact commit.

**The GHCR packages must be public**, or every `docker compose pull` on the host needs a token.
That setting lives on the package, not the repo, and has to be set once after the first publish.

To build locally (an ordinary single-context build, since core installs from npm):

```sh
docker build -t mercury-financials .
docker build --target migrate -t mercury-financials-migrate .
docker run --rm -e DATABASE_URL=... mercury-financials-migrate
```

## Cold start, end to end

The sequence a fresh production database needs:

```sh
# 1. shared auth tables (core owns these)
npx mercury-core migrate

# 2. financials' own tables
docker run --rm -e DATABASE_URL="$DATABASE_URL" mercury-financials-migrate

# 3. start the app; it seeds the chart of accounts on first boot
docker run -d --name financials -e DATABASE_URL=... -e REDIS_URL=... ... mercury-financials
```

The chart of accounts (42 accounts) and the single entity row seed themselves on boot, idempotently,
so step 3 needs no separate seed command.

Then check it is actually up:

```sh
curl -fsS https://demo-financials.cardano-mercury.com/healthz   # {"status":"ok"}
```

`/healthz` checks the database, not just the HTTP server, so a container that cannot reach Postgres
reports `503 degraded` instead of pretending to be fine.
