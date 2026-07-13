import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as authSchema from './auth-schema';
import { env } from '$env/dynamic/private';

/**
 * The connection is built on first use, not at import time.
 *
 * SvelteKit's postbuild `analyse` step imports every server chunk to read each route's config, so
 * anything that throws (or dials a database) at module scope turns `npm run build` into something
 * that needs a live DATABASE_URL. A build should not need a database, and a production image should
 * not need a .env baked into it to compile.
 *
 * Connecting lazily also means the error, when the variable really is missing, arrives on the first
 * request that touches the database rather than at import, which is where it is actually
 * actionable.
 */
let client: ReturnType<typeof postgres> | undefined;

function getClient() {
	if (!client) {
		if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
		client = postgres(env.DATABASE_URL);
	}
	return client;
}

/** Defer `make` until the first property access, keeping the exported type unchanged. */
function lazy<T extends object>(make: () => T): T {
	let instance: T | undefined;
	return new Proxy({} as T, {
		get(_target, prop, receiver) {
			instance ??= make();
			return Reflect.get(instance, prop, receiver);
		}
	});
}

// App tables (with their relations) back db.query. The shared Better Auth tables get their own
// drizzle instance so their verbose generated types stay out of db's relational inference, which
// otherwise degrades to `any`. Both share the one connection.
export const db = lazy(() => drizzle(getClient(), { schema }));
export const authDb = lazy(() => drizzle(getClient(), { schema: authSchema }));
