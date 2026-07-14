// Shared Better Auth tables (user/session/account/verification/two_factor) from mercury-core,
// kept in their own module so they back a dedicated drizzle instance (authDb in ./index.ts).
// Keeping them out of the app schema stops their verbose generated types from pushing
// TypeScript's relational-query inference over its instantiation-depth limit. mercury-core owns
// their migrations.
export * from '@cardano-mercury/core/db';
