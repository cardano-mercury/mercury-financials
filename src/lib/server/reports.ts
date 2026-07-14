import { and, gte, lte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { transactions, type Account } from '$lib/server/db/schema';
import { getAccountIdByPath } from '$lib/server/accounts';
import { ACCOUNT_PATHS } from '$lib/server/db/accounts-data';

/**
 * Cash-book double-entry engine. Every transaction posts a Cash leg (its net lovelace), a fee leg
 * to Transaction Cost when the wallet paid the fee, and a contra leg to the categorised account.
 * Transfers between our own wallets post the contra leg back to Cash so they net to zero on
 * consolidation. Amounts are signed lovelace where positive is a debit and negative a credit, so
 * every transaction's entries sum to zero and the Trial Balance balances by construction.
 *
 * Everything here is ADA-denominated (lovelace); native tokens are out of scope for the POC.
 */

export interface LedgerTx {
	netLovelace: bigint;
	fees: bigint;
	walletIsInput: boolean;
	accountId: number | null;
}

export interface LedgerEntry {
	accountId: number;
	amount: bigint; // positive = debit, negative = credit
}

export interface LedgerContext {
	accountsById: Map<number, Account>;
	cashId: number;
	transactionCostId: number;
	otherIncomeId: number;
	otherExpensesId: number;
}

export function buildLedgerEntries(txs: LedgerTx[], ctx: LedgerContext): LedgerEntry[] {
	const entries: LedgerEntry[] = [];
	for (const tx of txs) {
		const cashDelta = tx.netLovelace;
		const feePortion = tx.walletIsInput ? tx.fees : 0n;
		const contraAmount = -cashDelta - feePortion;

		let contraId: number;
		if (tx.accountId == null) {
			contraId = contraAmount >= 0n ? ctx.otherExpensesId : ctx.otherIncomeId;
		} else if (ctx.accountsById.get(tx.accountId)?.isInternalTransfer) {
			contraId = ctx.cashId;
		} else {
			contraId = tx.accountId;
		}

		if (cashDelta !== 0n) entries.push({ accountId: ctx.cashId, amount: cashDelta });
		if (feePortion !== 0n) entries.push({ accountId: ctx.transactionCostId, amount: feePortion });
		if (contraAmount !== 0n) entries.push({ accountId: contraId, amount: contraAmount });
	}
	return entries;
}

export function aggregateBalances(entries: LedgerEntry[]): Map<number, bigint> {
	const balances = new Map<number, bigint>();
	for (const e of entries) {
		balances.set(e.accountId, (balances.get(e.accountId) ?? 0n) + e.amount);
	}
	return balances;
}

export interface TrialBalanceRow {
	account: Account;
	debit: bigint;
	credit: bigint;
}

export interface TrialBalance {
	rows: TrialBalanceRow[];
	totalDebit: bigint;
	totalCredit: bigint;
}

export function trialBalance(balances: Map<number, bigint>, accounts: Account[]): TrialBalance {
	const rows: TrialBalanceRow[] = [];
	let totalDebit = 0n;
	let totalCredit = 0n;
	for (const account of accounts) {
		if (account.isInternalTransfer) continue;
		const bal = balances.get(account.id) ?? 0n;
		if (bal === 0n) continue;
		const debit = bal > 0n ? bal : 0n;
		const credit = bal < 0n ? -bal : 0n;
		rows.push({ account, debit, credit });
		totalDebit += debit;
		totalCredit += credit;
	}
	return { rows, totalDebit, totalCredit };
}

export interface StatementLine {
	account: Account;
	amount: bigint;
}

export interface ProfitAndLoss {
	income: StatementLine[];
	expenses: StatementLine[];
	tax: StatementLine[];
	totalIncome: bigint;
	totalExpenses: bigint;
	totalTax: bigint;
	profitBeforeTax: bigint;
	profitForPeriod: bigint;
}

/** Presentation amount in the account's natural direction (income/liabilities/equity flip sign). */
function presented(account: Account, balance: bigint): bigint {
	return account.normalBalance === 'debit' ? balance : -balance;
}

export function profitAndLoss(balances: Map<number, bigint>, accounts: Account[]): ProfitAndLoss {
	const income: StatementLine[] = [];
	const expenses: StatementLine[] = [];
	const tax: StatementLine[] = [];

	for (const account of accounts) {
		if (account.statement !== 'profit_loss') continue;
		const amount = presented(account, balances.get(account.id) ?? 0n);
		if (account.section === 'Income') income.push({ account, amount });
		else if (account.section === 'Tax Expense') tax.push({ account, amount });
		else expenses.push({ account, amount });
	}

	const sum = (lines: StatementLine[]) => lines.reduce((s, l) => s + l.amount, 0n);
	const totalIncome = sum(income);
	const totalExpenses = sum(expenses);
	const totalTax = sum(tax);
	const profitBeforeTax = totalIncome - totalExpenses;

	return {
		income,
		expenses,
		tax,
		totalIncome,
		totalExpenses,
		totalTax,
		profitBeforeTax,
		profitForPeriod: profitBeforeTax - totalTax
	};
}

export interface BalanceSheet {
	assets: StatementLine[];
	equity: StatementLine[];
	liabilities: StatementLine[];
	totalAssets: bigint;
	totalEquity: bigint;
	totalLiabilities: bigint;
	/** Folded into equity so Assets = Equity + Liabilities. */
	periodResult: bigint;
}

/**
 * Build the Balance Sheet from cumulative balances. The cumulative P&L result is folded into equity
 * as a "Profit / (loss) for the period" line, which is what makes Assets equal Equity plus
 * Liabilities.
 */
export function balanceSheet(
	balances: Map<number, bigint>,
	accounts: Account[],
	periodResult: bigint
): BalanceSheet {
	const assets: StatementLine[] = [];
	const equity: StatementLine[] = [];
	const liabilities: StatementLine[] = [];

	for (const account of accounts) {
		if (account.statement !== 'balance_sheet') continue;
		const amount = presented(account, balances.get(account.id) ?? 0n);
		if (account.section === 'Assets') assets.push({ account, amount });
		else if (account.section === 'Equity') equity.push({ account, amount });
		else liabilities.push({ account, amount });
	}

	const sum = (lines: StatementLine[]) => lines.reduce((s, l) => s + l.amount, 0n);
	const totalAssets = sum(assets);
	const totalLiabilities = sum(liabilities);
	const totalEquity = sum(equity) + periodResult;

	return {
		assets,
		equity,
		liabilities,
		totalAssets,
		totalEquity,
		totalLiabilities,
		periodResult
	};
}

// --- DB loaders ---------------------------------------------------------------

export async function loadLedgerContext(): Promise<{ ctx: LedgerContext; accounts: Account[] }> {
	const accounts = await db.query.accounts.findMany({
		orderBy: (a, { asc }) => asc(a.sortOrder)
	});
	const accountsById = new Map(accounts.map((a) => [a.id, a]));
	return {
		accounts,
		ctx: {
			accountsById,
			cashId: await getAccountIdByPath(ACCOUNT_PATHS.cash),
			transactionCostId: await getAccountIdByPath(ACCOUNT_PATHS.transactionCost),
			otherIncomeId: await getAccountIdByPath(ACCOUNT_PATHS.otherIncome),
			otherExpensesId: await getAccountIdByPath(ACCOUNT_PATHS.otherExpenses)
		}
	};
}

async function loadLedgerTxs(opts: { from?: number; to?: number } = {}): Promise<LedgerTx[]> {
	const filters = [];
	if (opts.from !== undefined) filters.push(gte(transactions.blockTime, opts.from));
	if (opts.to !== undefined) filters.push(lte(transactions.blockTime, opts.to));

	const rows = await db
		.select({
			netLovelace: transactions.netLovelace,
			fees: transactions.fees,
			walletIsInput: transactions.walletIsInput,
			accountId: transactions.accountId
		})
		.from(transactions)
		.where(filters.length ? and(...filters) : undefined);

	return rows;
}

export interface Reports {
	entityName: string;
	trialBalance: TrialBalance;
	profitAndLoss: ProfitAndLoss;
	balanceSheet: BalanceSheet;
}

/**
 * Consolidated reports across every wallet. The Balance Sheet is cumulative as at `to`; the P&L
 * covers the `from`..`to` period. With no range (the default) both span all history and agree.
 */
export async function buildReports(opts: { from?: number; to?: number } = {}): Promise<Reports> {
	const { ctx, accounts } = await loadLedgerContext();
	const entity = await db.query.entitySettings.findFirst();

	const cumulativeTxs = await loadLedgerTxs({ to: opts.to });
	const periodTxs = await loadLedgerTxs(opts);

	const cumulativeBalances = aggregateBalances(buildLedgerEntries(cumulativeTxs, ctx));
	const periodBalances = aggregateBalances(buildLedgerEntries(periodTxs, ctx));

	const cumulativePl = profitAndLoss(cumulativeBalances, accounts);

	return {
		entityName: entity?.name ?? 'Your Entity',
		trialBalance: trialBalance(cumulativeBalances, accounts),
		profitAndLoss: profitAndLoss(periodBalances, accounts),
		balanceSheet: balanceSheet(cumulativeBalances, accounts, cumulativePl.profitForPeriod)
	};
}
