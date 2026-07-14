import { describe, it, expect } from 'vitest';
import {
	aggregateBalances,
	balanceSheet,
	buildLedgerEntries,
	profitAndLoss,
	trialBalance,
	type LedgerContext,
	type LedgerTx
} from './reports';
import type { Account, NormalBalance } from '$lib/server/db/schema';

function makeAccount(p: Partial<Account> & { id: number; normalBalance: NormalBalance }): Account {
	return {
		statement: null,
		section: null,
		subgroups: [],
		name: `acct-${p.id}`,
		path: `acct-${p.id}`,
		isCash: false,
		isInternalTransfer: false,
		sortOrder: p.id,
		...p
	} as Account;
}

const cash = makeAccount({
	id: 1,
	statement: 'balance_sheet',
	section: 'Assets',
	normalBalance: 'debit',
	isCash: true
});
const capital = makeAccount({
	id: 2,
	statement: 'balance_sheet',
	section: 'Equity',
	normalBalance: 'credit'
});
const otherIncome = makeAccount({
	id: 3,
	statement: 'profit_loss',
	section: 'Income',
	normalBalance: 'credit'
});
const txCost = makeAccount({
	id: 4,
	statement: 'profit_loss',
	section: 'Expense',
	normalBalance: 'debit'
});
const otherExpenses = makeAccount({
	id: 5,
	statement: 'profit_loss',
	section: 'Expense',
	normalBalance: 'debit'
});
const internal = makeAccount({ id: 6, normalBalance: 'debit', isInternalTransfer: true });

const accounts = [cash, capital, otherIncome, txCost, otherExpenses, internal];

const ctx: LedgerContext = {
	accountsById: new Map(accounts.map((a) => [a.id, a])),
	cashId: cash.id,
	transactionCostId: txCost.id,
	otherIncomeId: otherIncome.id,
	otherExpensesId: otherExpenses.id
};

// Received 5 ADA (income); paid 1.2 ADA to a supplier with 0.17 fee; transferred 3 ADA between
// two of our own wallets (0.17 fee on the sending leg).
const txs: LedgerTx[] = [
	{ netLovelace: 5_000_000n, fees: 0n, walletIsInput: false, accountId: otherIncome.id },
	{ netLovelace: -1_370_000n, fees: 170_000n, walletIsInput: true, accountId: otherExpenses.id },
	{ netLovelace: -3_170_000n, fees: 170_000n, walletIsInput: true, accountId: internal.id },
	{ netLovelace: 3_000_000n, fees: 0n, walletIsInput: false, accountId: internal.id }
];

describe('reports engine', () => {
	const balances = aggregateBalances(buildLedgerEntries(txs, ctx));

	it('keeps cash equal to receipts minus payments and fees', () => {
		// 5 - 1.2 - 0.17 - 0.17 = 3.46 ADA
		expect(balances.get(cash.id)).toBe(3_460_000n);
	});

	it('produces a balanced trial balance', () => {
		const tb = trialBalance(balances, accounts);
		expect(tb.totalDebit).toBe(tb.totalCredit);
		expect(tb.totalDebit).toBe(5_000_000n);
		// The internal transfer account never carries a balance.
		expect(tb.rows.find((r) => r.account.isInternalTransfer)).toBeUndefined();
	});

	it('computes profit as income minus expenses', () => {
		const pl = profitAndLoss(balances, accounts);
		expect(pl.totalIncome).toBe(5_000_000n);
		expect(pl.totalExpenses).toBe(1_540_000n); // 1.2 + 0.34 fees
		expect(pl.profitForPeriod).toBe(3_460_000n);
	});

	it('balances the balance sheet with the period result folded into equity', () => {
		const pl = profitAndLoss(balances, accounts);
		const bs = balanceSheet(balances, accounts, pl.profitForPeriod);
		expect(bs.totalAssets).toBe(3_460_000n);
		expect(bs.totalEquity + bs.totalLiabilities).toBe(bs.totalAssets);
	});
});
