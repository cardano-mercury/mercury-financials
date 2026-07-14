import { env } from '$env/dynamic/private';
import { BlockfrostClient, type Network } from '@cardano-mercury/core/cardano';

export * from '@cardano-mercury/core/cardano';

/** A Blockfrost client configured from this app's environment. */
export function createBlockfrost(): BlockfrostClient {
	return new BlockfrostClient(
		(env.BLOCKFROST_NETWORK as Network) ?? 'mainnet',
		env.BLOCKFROST_PROJECT_ID ?? ''
	);
}
