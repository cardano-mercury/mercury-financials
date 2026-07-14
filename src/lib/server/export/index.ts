import { buildReports } from '$lib/server/reports';
import { loadTransactionRegister } from '$lib/server/transactions';
import {
	balanceSheetCsv,
	profitAndLossCsv,
	transactionRegisterCsv,
	trialBalanceCsv,
	type CsvFile
} from './csv';

export const EXPORT_TYPES = ['register', 'trial-balance', 'balance-sheet', 'profit-loss'] as const;

export type ExportType = (typeof EXPORT_TYPES)[number];

export function isExportType(value: string): value is ExportType {
	return (EXPORT_TYPES as readonly string[]).includes(value);
}

/**
 * Build one export by name. Shared by the signed-in /export route and the read-only /demo/export
 * route so the two cannot drift into producing different CSVs for the same statement. Neither
 * caller may pass an unvalidated string: guard with `isExportType` first.
 */
export async function buildExport(type: ExportType): Promise<CsvFile> {
	if (type === 'register') {
		return transactionRegisterCsv(await loadTransactionRegister());
	}

	const reports = await buildReports();
	if (type === 'trial-balance') return trialBalanceCsv(reports.trialBalance);
	if (type === 'balance-sheet') return balanceSheetCsv(reports.balanceSheet, reports.entityName);
	return profitAndLossCsv(reports.profitAndLoss, reports.entityName);
}

export function csvResponse(file: CsvFile): Response {
	return new Response(file.content, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="${file.filename}"`
		}
	});
}
