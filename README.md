# Mercury Financials

A single-user tool that pulls a Cardano wallet's on-chain history and turns it into financial
reports: Trial Balance, Balance Sheet, P&L, and CSV export. It reads transaction and UTxO data
from Blockfrost, works out the spends and receives per counterparty from the eUTxO data, and maps
that toward double-entry accounting. It's a Catalyst proof of concept, so it stops at on-chain
data and leaves fiat conversion and full multi-address handling out of scope. See `docs/prd.md`
for the product context.

## Status

This is being rewritten from the original Laravel app to SvelteKit. The old Laravel code lives in
`archive/` (not tracked) for reference while the rewrite catches up. Don't build on it.

## Stack

- SvelteKit and TypeScript
- Postgres with Drizzle ORM
- Redis with BullMQ for the Blockfrost ingestion jobs
- Blockfrost for chain data

## Getting started

You'll need Node 22+, Docker (for local Postgres), and a Blockfrost project ID.

```sh
cp .env.example .env     # then fill in BLOCKFROST_PROJECT_ID
npm install
npm run db:start         # local Postgres via compose.yaml
npm run db:push          # apply the schema
npm run dev
```

## Common commands

```sh
npm run dev       # dev server
npm run build     # production build (Node adapter)
npm run check     # type check
npm run lint      # prettier + eslint
npm run format    # prettier --write

npm run db:push      # push schema to the db (dev)
npm run db:generate  # generate a migration
npm run db:migrate   # run migrations
npm run db:studio    # Drizzle Studio
```
