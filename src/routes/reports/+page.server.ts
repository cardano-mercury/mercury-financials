import type { PageServerLoad } from './$types';
import { buildReportsView } from '$lib/server/reports-view';

export const load: PageServerLoad = async () => buildReportsView();
