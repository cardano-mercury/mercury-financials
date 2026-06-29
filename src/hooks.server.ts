import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
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
	return resolve(event);
};
