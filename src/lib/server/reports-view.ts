import { buildReports, type StatementLine } from '$lib/server/reports';
import { formatAda } from '$lib/money';

const fmt = (lovelace: bigint) => (lovelace === 0n ? '–' : formatAda(lovelace, { decimals: 2 }));
const line = (l: StatementLine) => ({ name: l.account.name, amount: fmt(l.amount) });

/**
 * The reports, formatted for display for the /reports page. The Statements component consumes this
 * shape.
 */
export async function buildReportsView() {
	const reports = await buildReports();
	const { trialBalance: tb, profitAndLoss: pl, balanceSheet: bs } = reports;

	return {
		entityName: reports.entityName,
		trialBalance: {
			rows: tb.rows.map((r) => ({
				name: r.account.path,
				debit: fmt(r.debit),
				credit: fmt(r.credit)
			})),
			totalDebit: fmt(tb.totalDebit),
			totalCredit: fmt(tb.totalCredit)
		},
		profitAndLoss: {
			income: pl.income.map(line),
			expenses: pl.expenses.map(line),
			tax: pl.tax.map(line),
			totalIncome: fmt(pl.totalIncome),
			totalExpenses: fmt(pl.totalExpenses),
			totalTax: fmt(pl.totalTax),
			profitBeforeTax: fmt(pl.profitBeforeTax),
			profitForPeriod: fmt(pl.profitForPeriod)
		},
		balanceSheet: {
			assets: bs.assets.map(line),
			equity: bs.equity.map(line),
			liabilities: bs.liabilities.map(line),
			periodResult: fmt(bs.periodResult),
			totalAssets: fmt(bs.totalAssets),
			totalEquity: fmt(bs.totalEquity),
			totalLiabilities: fmt(bs.totalLiabilities),
			totalEquityAndLiabilities: fmt(bs.totalEquity + bs.totalLiabilities)
		}
	};
}
