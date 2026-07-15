import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';
import { startWalletSyncWorker } from '$lib/server/ingest/worker';
import { seedReferenceData } from '$lib/server/db/seed';
import { seedDemoWallet } from '$lib/server/demo-seed';

const globalForBoot = globalThis as unknown as { __mercuryBooted?: boolean };

// Boot once when the server starts (never during the build step): seed the chart of accounts, start
// the in-process ingestion worker, and, on the hosted demo, add the demo wallet so its statements
// are never empty. Seeding is idempotent; failures are logged, not fatal, so a not-yet-migrated
// database does not crash dev startup. Demo seeding runs after reference data so the chart of
// accounts exists before the queued sync tries to categorise against it.
if (!building && !globalForBoot.__mercuryBooted) {
	globalForBoot.__mercuryBooted = true;
	seedReferenceData()
		.then(() => seedDemoWallet())
		.catch((err) => console.error('[boot] seed failed (run migrations first?):', err.message));
	startWalletSyncWorker();
}

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	return svelteKitHandler({ event, resolve, auth, building });
};
