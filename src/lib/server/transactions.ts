import { desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { transactions } from '$lib/server/db/schema';

export interface RegisterRow {
	id: number;
	blockTime: number;
	hash: string;
	/** Counterparty label: the non-own party's name, or a truncated address. */
	counterparty: string;
	netLovelace: bigint;
	sent: bigint;
	received: bigint;
	fees: bigint;
	accountId: number | null;
	accountPath: string | null;
	tags: string[];
}

function truncate(bech32: string): string {
	return bech32.length > 16 ? `${bech32.slice(0, 8)}…${bech32.slice(-6)}` : bech32;
}

/**
 * The consolidated transaction register, newest first. Counterparty is derived from the parsed
 * flows: whichever address in the transaction is not one of ours, by name if the address book has
 * one, otherwise a truncated address.
 */
export async function loadTransactionRegister(): Promise<RegisterRow[]> {
	const rows = await db.query.transactions.findMany({
		orderBy: desc(transactions.blockTime),
		with: {
			account: true,
			tags: true,
			outputs: { with: { fromAddress: true, toAddress: true } }
		}
	});

	return rows.map((tx) => {
		const counterparties = new Map<string, string>();
		for (const o of tx.outputs) {
			for (const addr of [o.fromAddress, o.toAddress]) {
				if (addr && !addr.isOwn) {
					counterparties.set(addr.bech32, addr.name ?? truncate(addr.bech32));
				}
			}
		}

		return {
			id: tx.id,
			blockTime: tx.blockTime,
			hash: tx.hash,
			counterparty: [...counterparties.values()].join(', '),
			netLovelace: tx.netLovelace,
			sent: tx.netLovelace < 0n ? -tx.netLovelace : 0n,
			received: tx.netLovelace > 0n ? tx.netLovelace : 0n,
			fees: tx.fees,
			accountId: tx.accountId,
			accountPath: tx.account?.path ?? null,
			tags: tx.tags.map((t) => t.name)
		};
	});
}
