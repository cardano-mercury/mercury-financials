import { describe, it, expect } from 'vitest';
import { defaultCategoryPath } from './accounts';
import { ACCOUNT_PATHS } from '$lib/server/db/accounts-data';

const own = new Set(['addr1_me', 'addr1_me2']);

describe('defaultCategoryPath', () => {
	it('routes inflows to Other income', () => {
		expect(
			defaultCategoryPath({
				netLovelace: 5_000_000n,
				hasWithdrawal: false,
				counterparties: ['addr1_alice'],
				ownAddresses: own
			})
		).toBe(ACCOUNT_PATHS.otherIncome);
	});

	it('routes outflows to Other expenses', () => {
		expect(
			defaultCategoryPath({
				netLovelace: -1_200_000n,
				hasWithdrawal: false,
				counterparties: ['addr1_bob'],
				ownAddresses: own
			})
		).toBe(ACCOUNT_PATHS.otherExpenses);
	});

	it('routes reward withdrawals to Other income even when net is small', () => {
		expect(
			defaultCategoryPath({
				netLovelace: -200_000n,
				hasWithdrawal: true,
				counterparties: [],
				ownAddresses: own
			})
		).toBe(ACCOUNT_PATHS.otherIncome);
	});

	it('nets a transfer between our own wallets as an internal transfer', () => {
		expect(
			defaultCategoryPath({
				netLovelace: -3_000_000n,
				hasWithdrawal: false,
				counterparties: ['addr1_me2'],
				ownAddresses: own
			})
		).toBe(ACCOUNT_PATHS.internalTransfer);
	});
});
