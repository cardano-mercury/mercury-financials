import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { demoModeEnabled } from '$lib/server/demo';
import type { LayoutServerLoad } from './$types';

const AUTH_ROUTES = ['/login', '/signup'];

/** Routes an anonymous visitor may see. /demo is read-only and gated on DEMO_MODE. */
const isPublicRoute = (pathname: string) =>
	AUTH_ROUTES.includes(pathname) || (demoModeEnabled() && pathname.startsWith('/demo'));

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const onAuthRoute = AUTH_ROUTES.includes(url.pathname);

	if (!locals.user) {
		// On the hosted demo, an anonymous visitor arriving at the root came to see the statements,
		// not a login wall. Everywhere else, anonymous still means sign in.
		if (url.pathname === '/' && demoModeEnabled()) redirect(303, '/demo');
		if (!isPublicRoute(url.pathname)) redirect(303, '/login');
		return {
			user: null,
			entityName: 'Your Entity',
			wallets: [],
			hasWallets: false,
			demoMode: demoModeEnabled()
		};
	}

	if (onAuthRoute) redirect(303, '/');

	const entity = await db.query.entitySettings.findFirst();
	const wallets = await db.query.wallets.findMany({ with: { address: true } });

	return {
		user: { name: locals.user.name, email: locals.user.email },
		entityName: entity?.name ?? 'Your Entity',
		wallets: wallets.map((w) => ({ id: w.id, name: w.name, bech32: w.address.bech32 })),
		hasWallets: wallets.length > 0,
		demoMode: demoModeEnabled()
	};
};
