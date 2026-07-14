import { sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

/**
 * Liveness/readiness probe for the container orchestrator and the reverse proxy.
 *
 * It checks the database, because a financials container that cannot reach Postgres is useless
 * even though its HTTP server answers. Unauthenticated by necessity (the probe has no session) and
 * deliberately says nothing about the instance beyond up or down.
 */
export const GET: RequestHandler = async () => {
	try {
		await db.execute(sql`select 1`);
		return json({ status: 'ok' });
	} catch {
		return json({ status: 'degraded', database: 'unreachable' }, { status: 503 });
	}
};
