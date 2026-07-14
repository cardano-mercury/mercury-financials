# Change fragments

Every pull request that changes behaviour drops **one new file** in `unreleased/`. It does not touch
`CHANGELOG.md` and it does not touch the version in `package.json`.

That is the whole point. Those two files are exactly what several branches in flight would all try to
edit at once, and a changelog conflict is both certain and annoying. Writing a new file instead means
two PRs can never collide, however many are open.

The version and the changelog are written **once, at release**, by assembling whatever fragments have
accumulated.

## Adding one

```sh
npm run change -- minor Added category-dropdown "A dropdown for re-categorising a transaction."
```

Or write the file yourself, `.changes/unreleased/anything.md`:

```markdown
---
bump: minor
type: Added
---

A dropdown for re-categorising a transaction.
```

`bump` is `patch`, `minor`, or `major` — how far _this change_ moves the version. `type` is one of
Keep a Changelog's categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

The body is the changelog entry. Write it for someone reading the release notes, not for someone
reading the diff.

## How the version is decided

At release, the **largest** bump among the pending fragments wins. Ten `patch` fragments and one
`minor` release a minor. You never write a version number by hand, so two PRs cannot disagree about
what the next one is.

Pre-1.0, a `major` fragment bumps the minor instead: 1.0.0 is reserved for the proof-of-concept
delivery and is cut deliberately, not by accident.

## What CI enforces

- A pull request must add at least one fragment, or carry the `no-release` label (for changes that
  genuinely ship nothing: docs, CI, comments).
- Fragments must parse, and their `bump` and `type` must be valid.

## Releasing

Pushing to `development` opens (or updates) a release pull request against `main` that runs
`npm run changes:assemble`: it bumps `package.json`, writes the new section into `CHANGELOG.md`, and
deletes the fragments. Merging that PR is what publishes.
