# Contributing

Thanks for taking a look. This is a Catalyst-funded proof of concept, so the bar is "correct and
honest about its limits" rather than "feature complete".

## Branches

```
feature/*  ->  development  ->  main
```

- **`main`** is what gets released. It is protected: no direct pushes, no force-pushes, and every
  change arrives through a pull request with CI green.
- **`development`** is the integration branch. Day-to-day work targets it. It is protected too, and
  for the same reason `main` is: fragments accumulate here, so a direct push that skipped the checks
  would silently drop one and the next release would quietly miss it.
- **Feature branches** come off `development` and go back into it.

Both branches enforce their rules on administrators. That is deliberate. A gate an admin can walk
past is a suggestion, and it was not theoretical here: an earlier commit went straight onto `main`
while protection was on, because admins were exempt.

`main` only ever receives the release pull request, which is opened automatically (see below). If you
find yourself wanting to push straight to `main`, something has gone wrong.

## Every pull request adds a change fragment

Do **not** edit `CHANGELOG.md`, and do **not** touch the version in `package.json`. Those are the two
files every open branch would try to edit at once, and the conflict is guaranteed. Instead:

```sh
npm run change -- minor Added period-filter "Filter the reports by date range."
```

That writes one new file under `.changes/unreleased/`. A new file cannot conflict with another PR's
new file, however many are open. See `.changes/README.md` for the format.

`bump` is how far _your_ change moves the version: `patch` for a fix or an internal change, `minor`
for a feature, `major` for a break. At release, the largest bump among the accumulated fragments
decides the new version, so you never write a version number by hand and two PRs can never disagree
about what the next one is.

If your change genuinely ships nothing a user would notice, say so, in a fragment:

```sh
npm run change -- none ci-tidy "Reworks a workflow comment. No user-visible change."
```

A `bump: none` fragment moves no version and never reaches the changelog. It exists so that shipping
nothing is a decision recorded in the commit, rather than a label. A label is not part of the commit,
it can be changed after review, and a contributor without write access cannot set one.

## How a release happens

You do not cut one by hand.

1. A PR merges into `development`. CI runs.
2. If CI is green and fragments are pending, a **Release vX.Y.Z** pull request is opened against
   `main` automatically, by the org's **Mercury Release Bot**. It bumps `package.json`, writes the new
   `CHANGELOG.md` section, and deletes the fragments it consumed.
3. That PR runs the same CI as any other.
4. Merging it publishes: the images go to GHCR, the commit is tagged `vX.Y.Z`, and a GitHub release
   is cut from the changelog section.

The bot is a GitHub App owned by the organisation, and it is not decoration. GitHub refuses to let a
workflow run created with the built-in `GITHUB_TOKEN` trigger further workflow runs, so a release PR
opened that way would get **no checks at all**, they would sit at `action_required`, and they cannot
be approved. Since `main` requires those checks, such a release could never merge, and it would look
like an absence of checks rather than an error. An App installation token is a real actor, so what it
pushes runs CI normally. Setup lives in mercury-core, under `.claude/app-setup/`.

## How to merge

- **Feature PR into `development`: squash.** One commit per change, and the branch history stays
  readable.
- **Release PR into `main`: merge commit.** Not a squash.

That second rule is load-bearing and easy to get wrong. A squash gives `main` a commit that shares no
recent ancestor with `development`, even when their contents are identical. Every later release PR
then diffs against the beginning of the repository rather than against the last release: it happened
here once, and a two-line release showed as 102 files and 16,496 insertions. A merge commit keeps
`main` a true descendant of `development`, and the diff stays honest.

Publishing is deliberately downstream of testing. Nothing is built for the registry until a gate has
gone green on the exact commit being shipped, and no pull request can publish anything.

Pre-1.0, a `major` fragment bumps the minor version rather than minting 1.0.0. That version is
reserved for the proof-of-concept delivery and is cut deliberately.

## Before you open the PR

```sh
npm run lint     # prettier + eslint
npm run check    # svelte-check and the type check
npm run test     # vitest
npm run build    # must succeed with NO environment set
```

That last one matters more than it looks. SvelteKit's postbuild step imports every server module, so
**anything constructed at module scope runs during the build**. If you make `db/index.ts` or
`auth.ts` connect or throw at import time, the build starts needing a live database and a real auth
secret, and the Docker build (which has no `.env`, and must not) stops working. Both are built lazily
for exactly this reason. CI builds with an empty environment to keep it that way.

## The shared database

The Mercury apps share one Postgres. Everything this app owns is prefixed `financials_`; the
unprefixed `user`/`session`/`account`/`verification`/`two_factor` tables belong to
`@cardano-mercury/core`, and tokenomics owns `tokenomics_*`.

**There is no `db:push`, and please do not add one back.** `tablesFilter` does not cover sequences,
so `drizzle-kit push` from this app proposes dropping _tokenomics'_ migration journal, which would
destroy its history. Use `db:generate` and `db:migrate`, which only apply committed SQL.

`docs/deployment.md` has the rest, including the migration order.

## Style

Plain and specific. No em dashes, no arrows in prose, and avoid numbering document headings, because
renumbering breaks every link to them. Comments say what a thing does and why it exists; they are not
a changelog, and git already records how the code got here.

## Security

Please do not open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).
