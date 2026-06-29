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

/** Schedule a wallet to be synced. Deduplicated per wallet via a stable job id. */
export async function enqueueWalletSync(walletId: number, delayMs = 0) {
	await getWalletSyncQueue().add(
		'sync',
		{ walletId },
		{
			jobId: `wallet-${walletId}`,
			delay: delayMs,
			removeOnComplete: true,
			removeOnFail: 100
		}
	);
}
