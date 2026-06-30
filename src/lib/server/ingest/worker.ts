import { Worker } from 'bullmq';
import { getConnection, WALLET_SYNC_QUEUE, type WalletSyncJob } from './queue';
import { syncWalletPage, reparseWallet } from './sync';

const globalForWorker = globalThis as unknown as { __mercuryWorker?: Worker<WalletSyncJob> };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Start the in-process wallet-sync worker. For a single-user tool it is simplest to run the
 * worker inside the SvelteKit server rather than as a separate process, so $lib and $env resolve
 * normally. Guarded against HMR double-starts in dev.
 *
 * One job pages through all of a wallet's remaining history. We loop here rather than re-enqueue,
 * because re-adding the job while it is still active is a no-op under the per-wallet job id (which
 * we keep so a second sync request is deduplicated). A short pause between pages keeps us friendly
 * with Blockfrost rate limits.
 */
export function startWalletSyncWorker(): Worker<WalletSyncJob> {
	if (globalForWorker.__mercuryWorker) return globalForWorker.__mercuryWorker;

	const worker = new Worker<WalletSyncJob>(
		WALLET_SYNC_QUEUE,
		async (job) => {
			// Repair any rows from an older parser version before pulling new history.
			const reparsed = await reparseWallet(job.data.walletId);
			let pages = 0;
			let created = 0;
			for (;;) {
				const result = await syncWalletPage(job.data.walletId);
				pages++;
				created += result.created;
				// Stop at the end of history, or if a full page added nothing new (a busy block
				// boundary that would otherwise re-fetch the same page forever).
				if (!result.hasMore || result.created === 0) break;
				await sleep(250);
			}
			return { reparsed, pages, created };
		},
		{ connection: getConnection(), concurrency: 2 }
	);

	worker.on('failed', (job, err) => {
		console.error(`[wallet-sync] job ${job?.id} failed:`, err.message);
	});

	globalForWorker.__mercuryWorker = worker;
	return worker;
}
