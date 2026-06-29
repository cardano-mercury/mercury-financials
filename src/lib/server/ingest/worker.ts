import { Worker } from 'bullmq';
import { getConnection, WALLET_SYNC_QUEUE, enqueueWalletSync, type WalletSyncJob } from './queue';
import { syncWalletPage } from './sync';

const globalForWorker = globalThis as unknown as { __mercuryWorker?: Worker<WalletSyncJob> };

/**
 * Start the in-process wallet-sync worker. For a single-user tool it is simplest to run the
 * worker inside the SvelteKit server rather than as a separate process, so $lib and $env resolve
 * normally. Guarded against HMR double-starts in dev.
 *
 * When a sync page comes back full there is more history to pull, so we re-enqueue the next page
 * after a short delay to stay friendly with Blockfrost rate limits.
 */
export function startWalletSyncWorker(): Worker<WalletSyncJob> {
	if (globalForWorker.__mercuryWorker) return globalForWorker.__mercuryWorker;

	const worker = new Worker<WalletSyncJob>(
		WALLET_SYNC_QUEUE,
		async (job) => {
			const result = await syncWalletPage(job.data.walletId);
			if (result.hasMore) {
				await enqueueWalletSync(job.data.walletId, 1000);
			}
			return result;
		},
		{ connection: getConnection(), concurrency: 2 }
	);

	worker.on('failed', (job, err) => {
		console.error(`[wallet-sync] job ${job?.id} failed:`, err.message);
	});

	globalForWorker.__mercuryWorker = worker;
	return worker;
}
