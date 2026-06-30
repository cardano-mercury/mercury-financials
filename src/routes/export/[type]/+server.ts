import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildReports } from '$lib/server/reports';
import { loadTransactionRegister } from '$lib/server/transactions';
import {
	balanceSheetCsv,
	profitAndLossCsv,
	transactionRegisterCsv,
	trialBalanceCsv,
	type CsvFile
} from '$lib/server/export/csv';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Sign in to export.');

	let file: CsvFile;

	if (params.type === 'register') {
		file = transactionRegisterCsv(await loadTransactionRegister());
	} else {
		const reports = await buildReports();
		if (params.type === 'trial-balance') file = trialBalanceCsv(reports.trialBalance);
		else if (params.type === 'balance-sheet')
			file = balanceSheetCsv(reports.balanceSheet, reports.entityName);
		else if (params.type === 'profit-loss')
			file = profitAndLossCsv(reports.profitAndLoss, reports.entityName);
		else throw error(404, 'Unknown export');
	}

	return new Response(file.content, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="${file.filename}"`
		}
	});
};
