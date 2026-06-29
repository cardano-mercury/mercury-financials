# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working agreements

- Branching and committing directly is fine, no need to ask first. Do not add
  `Co-Authored-By` / Claude co-author trailers to commit messages.
- In any prose (commits, PRs, docs, comments) avoid the usual AI tells: no em dashes, no
  arrows in text, and don't lean on numbered section headings (they break relative links if
  the order changes later). Keep it plain and conversational.

## What this is

Mercury: Financials is a Catalyst-funded proof of concept that ingests a Cardano wallet's
on-chain transaction history and structures it for financial reporting (Trial Balance, Balance
Sheet, P&L, CSV export). It pulls raw transaction and UTxO data from Blockfrost, then derives
per-counterparty spends and receives from the eUTxO data so single-entry blockchain activity can
be mapped toward double-entry accounting. See `docs/prd.md` for the full product context and the
explicit POC boundaries (no fiat conversion, no oracle pricing, no full multi-address wallet
handling).

It is a single-user "CFO Tool". There is no multi-user team concept by design.

## Status: mid-rewrite

The project was originally a Laravel 12 plus Inertia plus Vue app. It is being rewritten as a
SvelteKit app. The old Laravel code has been moved to `archive/` (git-excluded) for reference
only while the rewrite reaches parity. Do not build on or edit `archive/`. The two pieces worth
porting from it are the Blockfrost client and the eUTxO parsing logic:

- `archive/application/app/Services/BlockfrostService.php` (Blockfrost REST calls)
- `archive/application/app/Jobs/ParseTransactionOutput.php` (eUTxO diffing into spends/receives)
- `archive/application/app/Jobs/GetWalletTransactions.php` (incremental, paginated sync)

## Stack

- SvelteKit and TypeScript, full-stack (the SvelteKit server hosts the API and the job runner).
- Postgres via Drizzle ORM. Schema in `src/lib/server/db/schema.ts`, client in
  `src/lib/server/db/index.ts`. Local Postgres runs from `compose.yaml`.
- BullMQ on Redis for the Blockfrost ingestion jobs (mirrors the old Horizon pipeline). Not wired
  up yet.
- Blockfrost over fetch, ported from the archived `BlockfrostService`.
- Money: lovelace and token quantities are integers, handled as BigInt. No decimal library yet
  because the POC excludes fiat conversion.
- Tailwind CSS, Prettier, ESLint from the scaffold. For the data-heavy admin UI the plan is
  shadcn-svelte plus TanStack Table rather than hand-rolling every grid.
- Auth is light (single user); not added yet.

## Commands

```bash
npm run dev            # SvelteKit dev server
npm run build          # production build (Node adapter)
npm run check          # svelte-check + type check
npm run lint           # prettier --check and eslint
npm run format         # prettier --write

npm run db:start       # start local Postgres (compose.yaml)
npm run db:push        # push schema to the db (dev)
npm run db:generate    # generate a migration from schema changes
npm run db:migrate     # run migrations
npm run db:studio      # Drizzle Studio
```

Env lives in `.env` (copy from `.env.example`): `DATABASE_URL`, `REDIS_URL`, `BLOCKFROST_NETWORK`
(`mainnet`/`preview`/`preprod`), `BLOCKFROST_PROJECT_ID`.

## Domain notes carried over from the old app

The accounting model is the reason the project exists and is the bulk of the remaining work. It
does not exist yet and is being designed with Adam, who provides the chart of accounts and
categories.

How the old app derived flows, worth preserving in the port: for each transaction it diffed the
wallet's input versus output amounts per asset unit across the tx UTxOs to compute net spends and
receives, attributed each flow to a counterparty address, and tagged the tx (`spend`, `receive`,
`withdrawal`, and previously `mint`/`burn`). Unmatched positive diffs were treated as token
minting. Stake reward withdrawals were read separately and accrue when earned, not when withdrawn
to a UTxO (a known PRD nuance).
