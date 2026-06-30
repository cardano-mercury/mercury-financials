import { and, desc, eq, lt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { addresses, outputs, transactionTags, transactions, wallets } from '$lib/server/db/schema';
import {
	BlockfrostClient,
	type TransactionWithdrawal,
	type TransactionUtxos
} from '$lib/server/blockfrost';
import { parseTransaction, PARSER_VERSION, type Flow } from './parse';
import { defaultCategoryPath, getAccountIdByPath } from '$lib/server/accounts';
import { makeOwnershipTest } from '$lib/server/cardano';

/** A Blockfrost page is 100 rows; a full page means there may be more to fetch. */
const PAGE_SIZE = 100;

async function getOrCreateAddressId(bech32: string): Promise<number> {
	const existing = await db.query.addresses.findFirst({ where: eq(addresses.bech32, bech32) });
	if (existing) return existing.id;

	const [created] = await db
		.insert(addresses)
		.values({ bech32 })
		.onConflictDoNothing()
		.returning({ id: addresses.id });
	if (created) return created.id;

	// Lost a race; the row exists now.
	const again = await db.query.addresses.findFirst({ where: eq(addresses.bech32, bech32) });
	if (!again) throw new Error(`Failed to resolve address ${bech32}`);
	return again.id;
}

async function persistFlows(
	transactionId: number,
	walletAddressId: number,
	tags: string[],
	flows: Flow[]
) {
	for (const name of tags) {
		await db.insert(transactionTags).values({ transactionId, name }).onConflictDoNothing();
	}

	for (const flow of flows) {
		const counterpartyId = flow.counterparty
			? await getOrCreateAddressId(flow.counterparty)
			: null;
		const fromAddressId = flow.kind === 'spend' ? walletAddressId : counterpartyId;
		const toAddressId = flow.kind === 'spend' ? counterpartyId : walletAddressId;

		await db
			.insert(outputs)
			.values({
				transactionId,
				hash: flow.hash,
				index: flow.index,
				unit: flow.unit,
				quantity: flow.quantity,
				fromAddressId,
				toAddressId
			})
			.onConflictDoNothing();
	}
}

export interface SyncPageResult {
	fetched: number;
	created: number;
	hasMore: boolean;
}

/**
 * Fetch and ingest one page of a wallet's transactions, newest sync state forward. Mirrors the
 * archived GetWalletTransactions + ParseTransactionOutput, collapsed into one pass: for each new
 * transaction we pull its detail, utxos, and withdrawals, store it, then parse it into flows.
 *
 * Returns hasMore when the page was full, so the caller can fetch the next page.
 */
export async function syncWalletPage(walletId: number): Promise<SyncPageResult> {
	const wallet = await db.query.wallets.findFirst({
		where: eq(wallets.id, walletId),
		with: { address: true }
	});
	if (!wallet) throw new Error(`Wallet ${walletId} not found`);

	const bf = new BlockfrostClient();
	const isOwn = makeOwnershipTest(wallet.address.bech32, wallet.address.stakeKey);

	const ownAddresses = new Set(
		(await db.query.addresses.findMany({ where: eq(addresses.isOwn, true) })).map(
			(a) => a.bech32
		)
	);

	const [latest] = await db
		.select({ blockHeight: transactions.blockHeight })
		.from(transactions)
		.where(eq(transactions.walletId, walletId))
		.orderBy(desc(transactions.blockHeight))
		.limit(1);

	const listed = await bf.getAddressTransactions(wallet.address.bech32, {
		from: latest?.blockHeight
	});

	let created = 0;

	for (const item of listed) {
		const already = await db.query.transactions.findFirst({
			where: and(eq(transactions.walletId, walletId), eq(transactions.hash, item.tx_hash))
		});
		if (already) continue;

		const detail = await bf.getTransaction(item.tx_hash);
		const utxos: TransactionUtxos = await bf.getTransactionUtxos(item.tx_hash);
		const withdrawals: TransactionWithdrawal[] =
			detail.withdrawal_count > 0 ? await bf.getTransactionWithdrawals(item.tx_hash) : [];

		const parsed = parseTransaction({
			hash: detail.hash,
			isOwnAddress: isOwn,
			stakeAddress: wallet.address.stakeKey,
			fees: BigInt(detail.fees),
			utxos,
			withdrawals
		});

		const [row] = await db
			.insert(transactions)
			.values({
				walletId,
				hash: detail.hash,
				block: detail.block,
				blockHeight: detail.block_height,
				blockTime: detail.block_time,
				slot: BigInt(detail.slot),
				index: detail.index,
				fees: BigInt(detail.fees),
				deposit: BigInt(detail.deposit),
				size: detail.size,
				invalidBefore: detail.invalid_before,
				invalidHereafter: detail.invalid_hereafter,
				utxoCount: detail.utxo_count,
				withdrawalCount: detail.withdrawal_count,
				mirCertCount: detail.mir_cert_count,
				delegationCount: detail.delegation_count,
				stakeCertCount: detail.stake_cert_count,
				poolUpdateCount: detail.pool_update_count,
				poolRetireCount: detail.pool_retire_count,
				assetMintOrBurnCount: detail.asset_mint_or_burn_count,
				redeemerCount: detail.redeemer_count,
				validContract: detail.valid_contract,
				outputAmount: detail.output_amount,
				withdrawals,
				utxoDetail: utxos,
				netLovelace: parsed.netLovelace,
				walletIsInput: parsed.walletIsInput,
				parserVersion: PARSER_VERSION,
				parsedAt: new Date()
			})
			.onConflictDoNothing()
			.returning({ id: transactions.id });

		// A concurrent sync may have inserted it between our check and insert.
		if (!row) continue;
		created++;

		await persistFlows(row.id, wallet.addressId, parsed.tags, parsed.flows);

		const path = defaultCategoryPath({
			netLovelace: parsed.netLovelace,
			hasWithdrawal: parsed.tags.includes('withdrawal'),
			counterparties: parsed.flows.map((f) => f.counterparty),
			ownAddresses
		});
		await db
			.update(transactions)
			.set({ accountId: await getAccountIdByPath(path) })
			.where(eq(transactions.id, row.id));
	}

	await db.update(wallets).set({ lastSyncedAt: new Date() }).where(eq(wallets.id, walletId));

	return { fetched: listed.length, created, hasMore: listed.length >= PAGE_SIZE };
}

/**
 * Re-derive transactions that were parsed by an older parser version, using the stored Blockfrost
 * payloads (no API calls). This is how a parsing fix repairs existing data. It recomputes the
 * flows, tags, cash leg, and the default category, so a transaction's category may move (for
 * example from income to a spend) when the fix changes what it really was.
 */
export async function reparseWallet(walletId: number): Promise<number> {
	const wallet = await db.query.wallets.findFirst({
		where: eq(wallets.id, walletId),
		with: { address: true }
	});
	if (!wallet) return 0;

	const isOwn = makeOwnershipTest(wallet.address.bech32, wallet.address.stakeKey);
	const ownAddresses = new Set(
		(await db.query.addresses.findMany({ where: eq(addresses.isOwn, true) })).map(
			(a) => a.bech32
		)
	);

	const stale = await db.query.transactions.findMany({
		where: and(
			eq(transactions.walletId, walletId),
			lt(transactions.parserVersion, PARSER_VERSION)
		)
	});

	let count = 0;
	for (const tx of stale) {
		const utxos = tx.utxoDetail as TransactionUtxos | null;
		if (!utxos) continue;
		const withdrawals = (tx.withdrawals as TransactionWithdrawal[] | null) ?? [];

		const parsed = parseTransaction({
			hash: tx.hash,
			isOwnAddress: isOwn,
			stakeAddress: wallet.address.stakeKey,
			fees: tx.fees,
			utxos,
			withdrawals
		});

		await db.delete(outputs).where(eq(outputs.transactionId, tx.id));
		await db.delete(transactionTags).where(eq(transactionTags.transactionId, tx.id));
		await persistFlows(tx.id, wallet.addressId, parsed.tags, parsed.flows);

		const path = defaultCategoryPath({
			netLovelace: parsed.netLovelace,
			hasWithdrawal: parsed.tags.includes('withdrawal'),
			counterparties: parsed.flows.map((f) => f.counterparty),
			ownAddresses
		});

		await db
			.update(transactions)
			.set({
				netLovelace: parsed.netLovelace,
				walletIsInput: parsed.walletIsInput,
				accountId: await getAccountIdByPath(path),
				parserVersion: PARSER_VERSION,
				parsedAt: new Date()
			})
			.where(eq(transactions.id, tx.id));
		count++;
	}

	return count;
}
