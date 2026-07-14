# Mercury Financials

A single-user tool that pulls a Cardano wallet's on-chain history and turns it into financial
reports: Trial Balance, Balance Sheet, P&L, and CSV export. It reads transaction and UTxO data
from Blockfrost, works out the spends and receives per counterparty from the eUTxO data, and maps
that toward double-entry accounting. It's a Catalyst proof of concept, so it stops at on-chain
data and leaves fiat conversion and full multi-address handling out of scope. See `docs/prd.md`
for the product context.

It was rewritten from an earlier Laravel app to SvelteKit. The old Laravel code lives in
`archive/` (not tracked) for reference. Don't build on it.

## Stack

- SvelteKit and TypeScript
- Postgres with Drizzle ORM
- Redis with BullMQ for the Blockfrost ingestion jobs (the worker runs in-process)
- Blockfrost for chain data, MeshJS for CIP-30 wallet connect

## Getting started

You'll need Node 22+, Docker (for Postgres and Redis), and a Blockfrost project ID.

```sh
cp .env.example .env     # then fill in BLOCKFROST_PROJECT_ID (and set BLOCKFROST_NETWORK)
npm install
npm run db:start         # Postgres + Redis via compose.yaml (leave running)
npm run db:auth          # shared auth tables (core owns these)
npm run db:migrate       # apply the schema
npm run dev              # the chart of accounts seeds itself on first boot
```

A note on the database: the Mercury apps share one Postgres. Everything this app owns is prefixed
`financials_`; the unprefixed `user`/`session`/`account`/`verification`/`two_factor` tables belong
to mercury-core, and tokenomics owns `tokenomics_*`. `db:auth` creates the shared auth tables as a
stopgap until core ships its own migration runner.

There is deliberately no `db:push`. `tablesFilter` does not cover sequences, so `drizzle-kit push`
proposes dropping tokenomics' migration journal and would destroy its history. Use `db:generate`
and `db:migrate`.

Then open the app:

1. Name your entity under Settings. It heads every statement and CSV.
2. Add a wallet by address, $handle, or a CIP-30 browser wallet.
3. It syncs the wallet's history from Blockfrost in the background. Hit Sync to pull more.
4. On the Transactions page, set each row's Purpose (its account). Sensible defaults are applied
   on ingest, so reports work right away.
5. Name counterparties in the Address book.
6. View the Trial Balance, Balance Sheet, and P&L under Reports, and export any of them (plus the
   transaction register) as CSV.

Reports consolidate across every wallet you add, denominated in ADA. Transfers between your own
wallets net out.

## Common commands

```sh
npm run dev       # dev server
npm run build     # production build (Node adapter)
npm run check     # type check
npm run lint      # prettier + eslint
npm run format    # prettier --write

npm run db:start     # start Postgres + Redis (detached)
npm run db:stop      # stop them
npm run db:auth      # shared auth tables (runs mercury-core migrate)
npm run db:generate  # generate a migration
npm run db:migrate   # run migrations
npm run db:studio    # Drizzle Studio
```

## Deploying

See `docs/deployment.md`: the shared-database rules and migration order, the environment matrix,
the `DEMO_MODE` public read-only demo, and how to build the image. The stack that runs financials
and tokenomics together on one machine (Caddy, Postgres, Redis, both apps) lives in mercury-core
under `deploy/`.
probe
