import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';
import { startWalletSyncWorker } from '$lib/server/ingest/worker';
import { seedReferenceData } from '$lib/server/db/seed';

const globalForBoot = globalThis as unknown as { __mercuryBooted?: boolean };

// Boot once when the server starts (never during the build step): seed the chart of accounts and
// start the in-process ingestion worker. Seeding is idempotent; failures are logged, not fatal,
// so a not-yet-migrated database does not crash dev startup.
if (!building && !globalForBoot.__mercuryBooted) {
	globalForBoot.__mercuryBooted = true;
	seedReferenceData().catch((err) =>
		console.error('[boot] seed failed (run `npm run db:push` first?):', err.message)
	);
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
