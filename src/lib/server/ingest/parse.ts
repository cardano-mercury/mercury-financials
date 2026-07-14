import type { TransactionUtxos, TransactionWithdrawal } from '$lib/server/blockfrost';

/**
 * eUTxO -> accounting flows, ported from the archived ParseTransactionOutput job.
 *
 * For a single transaction it diffs the wallet's inputs against its outputs per asset unit, then
 * attributes each net flow to a counterparty address. The result is a set of tags plus a list of
 * directional flows that the caller turns into `outputs` rows.
 *
 * Faithful to the original with one deliberate fix: the network fee is only subtracted from a
 * spend when the unit is lovelace (the fee is denominated in lovelace), where the PHP subtracted
 * it from every unit.
 */

export const MINT_INDEX = 9999;
const LOVELACE = 'lovelace';

/**
 * Bump when the parsing logic changes so stored transactions can be re-derived. v2 judges wallet
 * ownership by stake key (not just the one tracked address), so change returning to a different
 * address of the same wallet is no longer mistaken for income.
 */
export const PARSER_VERSION = 2;

export type FlowKind = 'spend' | 'receive';

export interface Flow {
	kind: FlowKind;
	hash: string;
	index: number;
	unit: string;
	quantity: bigint;
	/** Recipient for a spend, sender for a receive. Null means mint/burn with no counterparty. */
	counterparty: string | null;
}

export interface ParseResult {
	tags: string[];
	flows: Flow[];
	/** True wallet lovelace change (outputs minus inputs); the Cash leg for the ledger. */
	netLovelace: bigint;
	/** Whether the wallet provided any input, i.e. whether it paid this transaction's fee. */
	walletIsInput: boolean;
}

function sumByUnit(amounts: { unit: string; quantity: string }[], into: Map<string, bigint>) {
	for (const { unit, quantity } of amounts) {
		into.set(unit, (into.get(unit) ?? 0n) + BigInt(quantity));
	}
}

export function parseTransaction(params: {
	hash: string;
	/** True when an address belongs to the wallet, by stake key rather than a single address. */
	isOwnAddress: (address: string) => boolean;
	stakeAddress: string | null;
	fees: bigint;
	utxos: TransactionUtxos;
	withdrawals: TransactionWithdrawal[];
}): ParseResult {
	const { hash, isOwnAddress, stakeAddress, fees, utxos, withdrawals } = params;

	const input = new Map<string, bigint>();
	const output = new Map<string, bigint>();

	let walletIsInput = false;
	for (const i of utxos.inputs) {
		if (isOwnAddress(i.address)) {
			walletIsInput = true;
			sumByUnit(i.amount, input);
		}
	}
	for (const o of utxos.outputs) {
		if (isOwnAddress(o.address)) sumByUnit(o.amount, output);
	}

	const netLovelace = (output.get(LOVELACE) ?? 0n) - (input.get(LOVELACE) ?? 0n);

	const tags = new Set<string>();
	if (stakeAddress) {
		for (const w of withdrawals) {
			if (w.address === stakeAddress) tags.add('withdrawal');
		}
	}

	// Net change per unit across every unit the wallet touched on either side.
	const units = new Set<string>([...input.keys(), ...output.keys()]);
	const flows: Flow[] = [];
	let sawSpend = false;
	let sawReceive = false;

	for (const unit of units) {
		const net = (output.get(unit) ?? 0n) - (input.get(unit) ?? 0n);
		if (net === 0n) continue;

		if (net < 0n) {
			// Spend: allocate the outgoing amount across non-wallet recipient outputs.
			let remaining = -net;
			if (unit === LOVELACE) remaining -= fees;

			for (const o of utxos.outputs) {
				if (isOwnAddress(o.address)) continue;
				if (remaining <= 0n) break;
				for (const amount of o.amount) {
					if (amount.unit !== unit) continue;
					const change = min(remaining, BigInt(amount.quantity));
					if (change > 0n) {
						flows.push({
							kind: 'spend',
							hash,
							index: o.output_index,
							unit,
							quantity: change,
							counterparty: o.address
						});
						sawSpend = true;
						remaining -= change;
						if (remaining <= 0n) break;
					}
				}
			}
		} else {
			// Receive: allocate the incoming amount across non-wallet sender inputs.
			let remaining = net;
			let matched = false;
			for (const i of utxos.inputs) {
				if (isOwnAddress(i.address)) continue;
				if (remaining <= 0n) {
					matched = true;
					break;
				}
				for (const amount of i.amount) {
					if (amount.unit !== unit) continue;
					const change = min(BigInt(amount.quantity), remaining);
					flows.push({
						kind: 'receive',
						hash: i.tx_hash,
						index: i.output_index,
						unit,
						quantity: change,
						counterparty: i.address
					});
					sawReceive = true;
					remaining -= change;
					if (remaining <= 0n) {
						matched = true;
						break;
					}
				}
				if (matched) break;
			}

			if (!matched && remaining > 0n) {
				// No source input found: treat as a mint into the wallet.
				flows.push({
					kind: 'receive',
					hash,
					index: MINT_INDEX,
					unit,
					quantity: remaining,
					counterparty: null
				});
				sawReceive = true;
			}
		}
	}

	if (sawSpend) tags.add('spend');
	if (sawReceive) tags.add('receive');

	return { tags: [...tags], flows, netLovelace, walletIsInput };
}

function min(a: bigint, b: bigint): bigint {
	return a < b ? a : b;
}
