import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildReportsView } from '$lib/server/reports-view';
import { demoModeEnabled } from '$lib/server/demo';

export const load: PageServerLoad = async () => {
	if (!demoModeEnabled()) throw error(404, 'Not found');

	// Read-only by construction: this page exposes no actions, and the route defines none.
	return buildReportsView();
};
