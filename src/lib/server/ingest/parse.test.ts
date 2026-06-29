import { describe, it, expect } from 'vitest';
import { parseTransaction, MINT_INDEX } from './parse';
import type { TransactionUtxos } from '$lib/server/blockfrost';

const WALLET = 'addr1_wallet';
const STAKE = 'stake1_wallet';
const ALICE = 'addr1_alice';
const BOB = 'addr1_bob';

const ada = (q: string | number | bigint) => ({ unit: 'lovelace', quantity: String(q) });

describe('parseTransaction', () => {
	it('records a lovelace spend net of fees to the recipient', () => {
		// Wallet puts in 10 ADA, gets 3 back as change, pays 1 ADA fee, sends ~6 to Bob.
		const utxos: TransactionUtxos = {
			hash: 'tx1',
			inputs: [
				{
					address: WALLET,
					amount: [ada(10_000_000)],
					tx_hash: 'prev',
					output_index: 0,
					collateral: false,
					reference: false
				}
			],
			outputs: [
				{ address: BOB, amount: [ada(6_000_000)], output_index: 0, collateral: false },
				{ address: WALLET, amount: [ada(3_000_000)], output_index: 1, collateral: false }
			]
		};

		const { tags, flows } = parseTransaction({
			hash: 'tx1',
			walletAddress: WALLET,
			stakeAddress: STAKE,
			fees: 1_000_000n,
			utxos,
			withdrawals: []
		});

		expect(tags).toEqual(['spend']);
		expect(flows).toEqual([
			{
				kind: 'spend',
				hash: 'tx1',
				index: 0,
				unit: 'lovelace',
				quantity: 6_000_000n,
				counterparty: BOB
			}
		]);
	});

	it('records a receive from the sending input', () => {
		// Alice sends the wallet 5 ADA.
		const utxos: TransactionUtxos = {
			hash: 'tx2',
			inputs: [
				{
					address: ALICE,
					amount: [ada(5_500_000)],
					tx_hash: 'srcTx',
					output_index: 2,
					collateral: false,
					reference: false
				}
			],
			outputs: [
				{ address: WALLET, amount: [ada(5_000_000)], output_index: 0, collateral: false },
				{ address: ALICE, amount: [ada(300_000)], output_index: 1, collateral: false }
			]
		};

		const { tags, flows } = parseTransaction({
			hash: 'tx2',
			walletAddress: WALLET,
			stakeAddress: STAKE,
			fees: 200_000n,
			utxos,
			withdrawals: []
		});

		expect(tags).toEqual(['receive']);
		expect(flows).toEqual([
			{
				kind: 'receive',
				hash: 'srcTx',
				index: 2,
				unit: 'lovelace',
				quantity: 5_000_000n,
				counterparty: ALICE
			}
		]);
	});

	it('treats a token increase with no source input as a mint', () => {
		const TOKEN = 'policyid.tokenname';
		const utxos: TransactionUtxos = {
			hash: 'tx3',
			inputs: [
				{
					address: WALLET,
					amount: [ada(10_000_000)],
					tx_hash: 'prev',
					output_index: 0,
					collateral: false,
					reference: false
				}
			],
			outputs: [
				{
					address: WALLET,
					amount: [ada(8_000_000), { unit: TOKEN, quantity: '1000' }],
					output_index: 0,
					collateral: false
				}
			]
		};

		const { tags, flows } = parseTransaction({
			hash: 'tx3',
			walletAddress: WALLET,
			stakeAddress: STAKE,
			fees: 2_000_000n,
			utxos,
			withdrawals: []
		});

		// Lovelace net is -2,000,000 which equals the fee, so no lovelace flow remains.
		expect(tags).toEqual(['receive']);
		expect(flows).toEqual([
			{
				kind: 'receive',
				hash: 'tx3',
				index: MINT_INDEX,
				unit: TOKEN,
				quantity: 1000n,
				counterparty: null
			}
		]);
	});

	it('tags a reward withdrawal that matches the stake address', () => {
		const utxos: TransactionUtxos = {
			hash: 'tx4',
			inputs: [
				{
					address: WALLET,
					amount: [ada(10_000_000)],
					tx_hash: 'prev',
					output_index: 0,
					collateral: false,
					reference: false
				}
			],
			outputs: [
				{ address: WALLET, amount: [ada(11_500_000)], output_index: 0, collateral: false }
			]
		};

		const { tags } = parseTransaction({
			hash: 'tx4',
			walletAddress: WALLET,
			stakeAddress: STAKE,
			fees: 200_000n,
			utxos,
			withdrawals: [{ address: STAKE, amount: '1700000' }]
		});

		expect(tags).toContain('withdrawal');
		expect(tags).toContain('receive');
	});
});
