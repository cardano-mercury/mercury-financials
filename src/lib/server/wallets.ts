import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { addresses, wallets } from '$lib/server/db/schema';
import { createBlockfrost } from '$lib/server/blockfrost';
import { enqueueWalletSync } from '$lib/server/ingest/queue';

export class WalletError extends Error {}

/**
 * Add a wallet to track. Resolves the stake address from Blockfrost (needed to attribute reward
 * withdrawals during parsing), upserts the address as one we own, links the wallet, and queues a
 * first sync.
 */
export async function createWallet(input: { name: string; address: string }) {
	const name = input.name.trim();
	const entered = input.address.trim();
	if (!name) throw new WalletError('A wallet name is required.');
	if (!entered) throw new WalletError('Enter a wallet address or $handle.');

	const existingName = await db.query.wallets.findFirst({ where: eq(wallets.name, name) });
	if (existingName) throw new WalletError('A wallet with that name already exists.');

	const bf = createBlockfrost();

	// Accept a bech32 address or an ADA Handle ($name).
	let bech32 = entered;
	if (entered.startsWith('$')) {
		bech32 = await bf.resolveHandle(entered);
	} else if (!entered.startsWith('addr')) {
		throw new WalletError('Enter a valid Cardano address or $handle.');
	}

	const info = await bf.getAddress(bech32);

	// The address may already exist (a previously-seen counterparty). Promote it to one we own.
	const existingAddress = await db.query.addresses.findFirst({
		where: eq(addresses.bech32, bech32)
	});
	let addressId: number;
	if (existingAddress) {
		if (existingAddress.isOwn) throw new WalletError('That address is already tracked.');
		await db
			.update(addresses)
			.set({ isOwn: true, stakeKey: info.stake_address, updatedAt: new Date() })
			.where(eq(addresses.id, existingAddress.id));
		addressId = existingAddress.id;
	} else {
		const [created] = await db
			.insert(addresses)
			.values({ bech32, stakeKey: info.stake_address, isOwn: true })
			.returning({ id: addresses.id });
		addressId = created.id;
	}

	const [wallet] = await db.insert(wallets).values({ name, addressId }).returning();

	await enqueueWalletSync(wallet.id);

	return wallet;
}
