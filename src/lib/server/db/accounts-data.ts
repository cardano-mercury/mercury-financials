import type { NormalBalance, Statement } from './schema';

export interface SeedAccount {
	statement: Statement | null;
	section: string | null;
	subgroups: string[];
	name: string;
	path: string;
	normalBalance: NormalBalance;
	isCash: boolean;
	isInternalTransfer: boolean;
}

const STATEMENT_LABEL: Record<string, string> = {
	balance_sheet: 'Balance Sheet',
	profit_loss: 'Profit & Loss'
};

function acct(
	statement: Statement | null,
	section: string | null,
	subgroups: string[],
	name: string,
	normalBalance: NormalBalance,
	flags: { isCash?: boolean; isInternalTransfer?: boolean } = {}
): SeedAccount {
	const label = statement ? STATEMENT_LABEL[statement] : 'Other';
	const path = [label, section, ...subgroups, name].filter(Boolean).join(' > ');
	return {
		statement,
		section,
		subgroups,
		name,
		path,
		normalBalance,
		isCash: flags.isCash ?? false,
		isInternalTransfer: flags.isInternalTransfer ?? false
	};
}

/**
 * The chart of accounts from .claude/finance-docs/Mercury Drop Down. Order here is the report
 * order. Leaf names repeat across sections (e.g. Investments, Borrowings), so the full breadcrumb
 * path is the unique key.
 */
export const CHART_OF_ACCOUNTS: SeedAccount[] = [
	// Balance Sheet > Assets > Non Current Assets
	acct(
		'balance_sheet',
		'Assets',
		['Non Current Assets'],
		'Property, plant and equipment',
		'debit'
	),
	acct('balance_sheet', 'Assets', ['Non Current Assets'], 'Other intangible assets', 'debit'),
	acct(
		'balance_sheet',
		'Assets',
		['Non Current Assets', 'Financial assets'],
		'Investments',
		'debit'
	),
	acct('balance_sheet', 'Assets', ['Non Current Assets', 'Financial assets'], 'Loans', 'debit'),
	acct('balance_sheet', 'Assets', ['Non Current Assets', 'Financial assets'], 'Others', 'debit'),
	acct('balance_sheet', 'Assets', ['Non Current Assets'], 'Income tax assets (net)', 'debit'),
	acct('balance_sheet', 'Assets', ['Non Current Assets'], 'Other non-current assets', 'debit'),
	// Balance Sheet > Assets > Current Assets
	acct('balance_sheet', 'Assets', ['Current Assets'], 'Inventories', 'debit'),
	acct('balance_sheet', 'Assets', ['Current Assets'], 'Investment property', 'debit'),
	acct('balance_sheet', 'Assets', ['Current Assets', 'Financial assets'], 'Investments', 'debit'),
	acct(
		'balance_sheet',
		'Assets',
		['Current Assets', 'Financial assets'],
		'Trade receivables',
		'debit'
	),
	acct(
		'balance_sheet',
		'Assets',
		['Current Assets', 'Financial assets'],
		'Cash and cash equivalents',
		'debit',
		{ isCash: true }
	),
	acct(
		'balance_sheet',
		'Assets',
		['Current Assets', 'Financial assets'],
		'Other bank balances',
		'debit'
	),
	acct('balance_sheet', 'Assets', ['Current Assets', 'Financial assets'], 'Loans', 'debit'),
	acct(
		'balance_sheet',
		'Assets',
		['Current Assets', 'Financial assets'],
		'Others Financial Assets',
		'debit'
	),
	acct('balance_sheet', 'Assets', ['Current Assets'], 'Other current assets', 'debit'),
	// Balance Sheet > Equity
	acct('balance_sheet', 'Equity', [], 'Capital', 'credit'),
	acct('balance_sheet', 'Equity', [], 'Other equity', 'credit'),
	// Balance Sheet > Liabilities > Non Current Liabilities
	acct(
		'balance_sheet',
		'Liabilities',
		['Non Current Liabilities', 'Financial liabilities'],
		'Borrowings',
		'credit'
	),
	acct(
		'balance_sheet',
		'Liabilities',
		['Non Current Liabilities', 'Financial liabilities'],
		'Lease liabilities',
		'credit'
	),
	acct(
		'balance_sheet',
		'Liabilities',
		['Non Current Liabilities', 'Financial liabilities'],
		'Others',
		'credit'
	),
	acct('balance_sheet', 'Liabilities', ['Non Current Liabilities'], 'Provisions', 'credit'),
	acct(
		'balance_sheet',
		'Liabilities',
		['Non Current Liabilities'],
		'Other non-current liabilities',
		'credit'
	),
	// Balance Sheet > Liabilities > Current Liabilities
	acct(
		'balance_sheet',
		'Liabilities',
		['Current Liabilities', 'Financial liabilities'],
		'Borrowings',
		'credit'
	),
	acct(
		'balance_sheet',
		'Liabilities',
		['Current Liabilities', 'Financial liabilities'],
		'Lease liabilities',
		'credit'
	),
	acct(
		'balance_sheet',
		'Liabilities',
		['Current Liabilities', 'Financial liabilities'],
		'Trade payables',
		'credit'
	),
	acct(
		'balance_sheet',
		'Liabilities',
		['Current Liabilities', 'Financial liabilities'],
		'Others',
		'credit'
	),
	acct(
		'balance_sheet',
		'Liabilities',
		['Current Liabilities'],
		'Other current liabilities',
		'credit'
	),
	acct('balance_sheet', 'Liabilities', ['Current Liabilities'], 'Provisions', 'credit'),
	acct(
		'balance_sheet',
		'Liabilities',
		['Current Liabilities'],
		'Income tax liabilities (net)',
		'credit'
	),
	// Profit & Loss > Income
	acct('profit_loss', 'Income', [], 'Revenue from operations', 'credit'),
	acct('profit_loss', 'Income', [], 'Other income', 'credit'),
	// Profit & Loss > Expense
	acct(
		'profit_loss',
		'Expense',
		[],
		'Changes in inventories of finished goods, work in progress and stock in trade',
		'debit'
	),
	acct('profit_loss', 'Expense', [], 'Transaction Cost', 'debit'),
	acct('profit_loss', 'Expense', [], 'Operating and maintenance expenses', 'debit'),
	acct('profit_loss', 'Expense', [], 'Consulting expense', 'debit'),
	acct('profit_loss', 'Expense', [], 'Finance costs', 'debit'),
	acct('profit_loss', 'Expense', [], 'Depreciation and amortization expense', 'debit'),
	acct('profit_loss', 'Expense', [], 'Other expenses', 'debit'),
	// Profit & Loss > Tax Expense
	acct('profit_loss', 'Tax Expense', [], 'Current tax', 'debit'),
	acct('profit_loss', 'Tax Expense', [], 'Deferred tax', 'debit'),
	// Synthetic: nets transfers between our own wallets; excluded from the statements.
	acct(null, null, [], 'Internal transfer', 'debit', { isInternalTransfer: true })
];

/** Paths used by default categorisation and the ledger engine. */
export const ACCOUNT_PATHS = {
	cash: 'Balance Sheet > Assets > Current Assets > Financial assets > Cash and cash equivalents',
	transactionCost: 'Profit & Loss > Expense > Transaction Cost',
	otherIncome: 'Profit & Loss > Income > Other income',
	otherExpenses: 'Profit & Loss > Expense > Other expenses',
	internalTransfer: 'Internal transfer'
} as const;
