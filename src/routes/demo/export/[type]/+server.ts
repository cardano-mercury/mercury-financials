import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildExport, csvResponse, isExportType } from '$lib/server/export';
import { demoModeEnabled } from '$lib/server/demo';

/**
 * Unauthenticated CSV export, for the public demo only. Same builders as the signed-in /export
 * route, so the demo cannot show one set of numbers and download another.
 *
 * Everything it can emit (the three statements plus the transaction register) is derived from
 * public on-chain data for a wallet the instance owner chose to publish, so there is nothing here
 * that reading the chain would not also give you.
 */
export const GET: RequestHandler = async ({ params }) => {
	if (!demoModeEnabled()) throw error(404, 'Not found');
	if (!isExportType(params.type)) throw error(404, 'Unknown export');

	return csvResponse(await buildExport(params.type));
};
