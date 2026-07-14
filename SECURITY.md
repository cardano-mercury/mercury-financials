# Security

## Reporting a vulnerability

Please do not open a public issue.

Report it through GitHub's private advisory form:
[**Report a vulnerability**](https://github.com/cardano-mercury/mercury-financials/security/advisories/new).
If that is not available to you, email **adam@crypto2099.io**.

Expect an acknowledgement within a few working days. This is a small, grant-funded project rather
than a staffed product, so please be realistic about response times, and tell us if you intend to
disclose publicly so we can coordinate.

## What is in scope

This app reads on-chain data and holds bookkeeping decisions about it. The things worth reporting:

- Anything that lets an unauthenticated visitor read or change an instance's books. Note that
  `DEMO_MODE=true` **intentionally** publishes a read-only view of the statements and their CSV
  exports at `/demo`; that is the documented purpose of the flag, not a vulnerability. A write path
  reachable without a session is.
- Session or authentication flaws. Auth is Better Auth, shared across the Mercury apps through
  `@cardano-mercury/core` and a cookie scoped to the parent domain, so a session-fixation or
  cross-subdomain issue can affect more than this app.
- Anything that causes one Mercury app to read, alter, or drop another's tables in the shared
  Postgres.
- Secrets reaching somewhere they should not: a published image, a build artifact, a log line. The
  Blockfrost project id and `BETTER_AUTH_SECRET` are the ones that matter.
- Injection through on-chain data. Transaction metadata, asset names and ADA Handles are attacker
  controlled: anyone can mint an asset whose name is a script tag and send it to a tracked wallet.

## What is not in scope

- **The accounting itself.** This is a proof of concept. It does not convert to fiat, does not use
  oracle pricing, and does not fully handle multi-address wallets. Statements it produces need review
  by a qualified accountant, which the README says plainly. A categorisation you disagree with is a
  bug or a design discussion, not a vulnerability.
- Findings that require an attacker to already control the host, the database, or the operator's
  account.
- Anything in `archive/`. That is the retired Laravel app, kept locally for reference, not built,
  not deployed, and not tracked in this repository.
- Denial of service by pointing the ingester at an enormous wallet. It is a single-user tool and the
  sync is rate-limited by Blockfrost, not by us.

## Operational notes for anyone running an instance

- `BETTER_AUTH_SECRET` must be identical across the Mercury apps for SSO, which also means one
  leaked secret is a leak for all of them. Generate it with `openssl rand -base64 32`.
- Leave `DEMO_MODE=false` unless you intend to publish that instance's books.
- Keep `SINGLE_USER_MODE=true` unless you want an open registration page. The first sign-up claims
  the instance and registration then closes, so claim it before you share the URL.
- Never bake `.env` into an image. Docker reads `.dockerignore` from the **build context root**, so
  building from a parent directory silently ignores an ignore file that sits next to the Dockerfile.
  The release workflow greps every image it pushes for exactly this.
