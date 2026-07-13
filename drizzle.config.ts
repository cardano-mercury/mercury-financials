import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

/**
 * The Mercury apps share one Postgres database, so drizzle-kit here is deliberately blinkered:
 *
 * - `schema` lists only this app's tables. The shared Better Auth tables (`user`, `session`,
 *   `account`, `verification`, `two_factor`) are re-exported from mercury-core into the runtime
 *   client (see db/auth-schema.ts) so we can query them, but core owns their migrations. If they
 *   were listed here, `generate` would emit them and `push` would fight core over them.
 * - `tablesFilter` keeps `push` from seeing anything outside our prefix. Without it, drizzle-kit
 *   treats tokenomics' and core's tables as drift and offers to drop them.
 * - `migrations.table` gives us our own journal, so three apps migrating one database do not
 *   overwrite each other's history.
 */
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	tablesFilter: ['financials_*'],
	migrations: { table: '__drizzle_migrations_financials', schema: 'public' },
	verbose: true,
	strict: true
});
