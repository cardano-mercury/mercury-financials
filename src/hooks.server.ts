import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { startWalletSyncWorker } from '$lib/server/ingest/worker';

// Boot the in-process ingestion worker once the server starts (never during the build step).
if (!building) {
	startWalletSyncWorker();
}

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
