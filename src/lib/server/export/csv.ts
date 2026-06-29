import { formatAda } from '$lib/money';
import type { BalanceSheet, ProfitAndLoss, TrialBalance } from '$lib/server/reports';
import type { RegisterRow } from '$lib/server/transactions';

type Cell = string | number;

function csvCell(value: Cell): string {
	const s = String(value);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Cell[][]): string {
	return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

const ada = (lovelace: bigint) => formatAda(lovelace, { group: false });

export interface CsvFile {
	filename: string;
	content: string;
}

export function trialBalanceCsv(tb: TrialBalance): CsvFile {
	const rows: Cell[][] = [['Account', 'Statement', 'Section', 'Debit (ADA)', 'Credit (ADA)']];
	for (const r of tb.rows) {
		rows.push([
			r.account.path,
			r.account.statement ?? '',
			r.account.section ?? '',
			ada(r.debit),
			ada(r.credit)
		]);
	}
	rows.push(['Total', '', '', ada(tb.totalDebit), ada(tb.totalCredit)]);
	return { filename: 'trial-balance.csv', content: toCsv(rows) };
}

export function profitAndLossCsv(pl: ProfitAndLoss, entityName: string): CsvFile {
	const rows: Cell[][] = [
		[entityName],
		['Statement of Profit and Loss'],
		[],
		['Particulars', 'Amount (ADA)'],
		['Income']
	];
	for (const l of pl.income) rows.push([l.account.name, ada(l.amount)]);
	rows.push(['Total income', ada(pl.totalIncome)], [], ['Expenses']);
	for (const l of pl.expenses) rows.push([l.account.name, ada(l.amount)]);
	rows.push(
		['Total expenses', ada(pl.totalExpenses)],
		[],
		['Profit before tax', ada(pl.profitBeforeTax)]
	);
	for (const l of pl.tax) rows.push([l.account.name, ada(l.amount)]);
	rows.push(
		['Total tax expense', ada(pl.totalTax)],
		['Profit for the period', ada(pl.profitForPeriod)]
	);
	return { filename: 'profit-and-loss.csv', content: toCsv(rows) };
}

export function balanceSheetCsv(bs: BalanceSheet, entityName: string): CsvFile {
	const rows: Cell[][] = [
		[entityName],
		['Balance Sheet'],
		[],
		['Particulars', 'Amount (ADA)'],
		['ASSETS']
	];
	for (const l of bs.assets) rows.push([l.account.name, ada(l.amount)]);
	rows.push(['Total assets', ada(bs.totalAssets)], [], ['EQUITY']);
	for (const l of bs.equity) rows.push([l.account.name, ada(l.amount)]);
	rows.push(
		['Profit / (loss) for the period', ada(bs.periodResult)],
		['Total equity', ada(bs.totalEquity)],
		[],
		['LIABILITIES']
	);
	for (const l of bs.liabilities) rows.push([l.account.name, ada(l.amount)]);
	rows.push(
		['Total liabilities', ada(bs.totalLiabilities)],
		['Total equity and liabilities', ada(bs.totalEquity + bs.totalLiabilities)]
	);
	return { filename: 'balance-sheet.csv', content: toCsv(rows) };
}

export function transactionRegisterCsv(register: RegisterRow[]): CsvFile {
	const rows: Cell[][] = [
		[
			'Date',
			'Tx Hash',
			'Counterparty',
			'Sent (ADA)',
			'Received (ADA)',
			'Fee (ADA)',
			'Purpose',
			'Tags'
		]
	];
	for (const r of register) {
		rows.push([
			new Date(r.blockTime * 1000).toISOString().slice(0, 10),
			r.hash,
			r.counterparty,
			r.sent > 0n ? ada(r.sent) : '',
			r.received > 0n ? ada(r.received) : '',
			ada(r.fees),
			r.accountPath ?? '',
			r.tags.join(' ')
		]);
	}
	return { filename: 'transaction-register.csv', content: toCsv(rows) };
}
