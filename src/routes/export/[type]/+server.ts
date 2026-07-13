import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildExport, csvResponse, isExportType } from '$lib/server/export';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Sign in to export.');
	if (!isExportType(params.type)) throw error(404, 'Unknown export');

	return csvResponse(await buildExport(params.type));
};
