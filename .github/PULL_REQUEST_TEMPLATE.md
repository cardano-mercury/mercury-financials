## What this changes

<!-- What does it do, and why? Write it for a reviewer who has not been following along. -->

## How it was verified

<!-- What did you actually run or drive? "Tests pass" is not verification if the change has a
     runtime surface. Say what you exercised and what you saw. -->

## Checklist

- [ ] Targets `development` (only the automated release PR targets `main`)
- [ ] Added a change fragment: `npm run change -- <patch|minor|major> <Type> <slug> "<what changed>"`
      (if it ships nothing a user would notice: `npm run change -- none <slug> "<why>"`)
- [ ] `npm run lint`, `npm run check`, `npm run test` pass
- [ ] `npm run build` passes **with no `.env` present** (nothing constructed at module scope)
- [ ] Did not edit `CHANGELOG.md` or the version in `package.json` (both are written at release)
- [ ] Docs updated if this changes a route, a command, an environment variable, or the schema
