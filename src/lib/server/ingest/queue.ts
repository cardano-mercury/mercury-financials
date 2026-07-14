import { Queue, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '$env/dynamic/private';

export const WALLET_SYNC_QUEUE = 'wallet-sync';

export interface WalletSyncJob {
	walletId: number;
}

/**
 * Shared ioredis connection for BullMQ. `maxRetriesPerRequest: null` is required by BullMQ.
 * Reused across HMR reloads in dev via a global so we don't leak connections.
 */
const globalForRedis = globalThis as unknown as {
	__mercuryRedis?: IORedis;
	__mercuryQueue?: Queue<WalletSyncJob>;
};

export function getRedis(): IORedis {
	let redis = globalForRedis.__mercuryRedis;
	if (!redis) {
		redis = new IORedis(env.REDIS_URL ?? 'redis://localhost:6379', {
			maxRetriesPerRequest: null
		});
		globalForRedis.__mercuryRedis = redis;
	}
	return redis;
}

/** BullMQ bundles its own ioredis, so hand it the connection as its expected type. */
export function getConnection(): ConnectionOptions {
	return getRedis() as unknown as ConnectionOptions;
}

export function getWalletSyncQueue(): Queue<WalletSyncJob> {
	let queue = globalForRedis.__mercuryQueue;
	if (!queue) {
		queue = new Queue<WalletSyncJob>(WALLET_SYNC_QUEUE, { connection: getConnection() });
		globalForRedis.__mercuryQueue = queue;
	}
	return queue;
}

/**
 * Schedule a wallet to be synced. The stable job id deduplicates a sync that is already queued or
 * running, which is what we want: hammering Sync should not stack up jobs.
 *
 * The catch is that BullMQ treats `add()` with an existing job id as a silent no-op even when that
 * job has already *finished*, and `removeOnFail` keeps failed jobs around. So one failed sync (an
 * expired Blockfrost key, a rate limit, a network blip) would wedge the wallet permanently: every
 * later Sync would return happily and do nothing, with no error anywhere. Clear a finished job
 * before re-adding, and leave queued or running ones alone so the dedupe still holds.
 */
export async function enqueueWalletSync(walletId: number, delayMs = 0) {
	const queue = getWalletSyncQueue();
	const jobId = `wallet-${walletId}`;

	const existing = await queue.getJob(jobId);
	if (existing) {
		const state = await existing.getState();
		if (state === 'completed' || state === 'failed') await existing.remove();
	}

	await queue.add(
		'sync',
		{ walletId },
		{
			jobId,
			delay: delayMs,
			removeOnComplete: true,
			removeOnFail: 100
		}
	);
}
