import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

const AUTH_ROUTES = ['/login', '/signup'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const onAuthRoute = AUTH_ROUTES.includes(url.pathname);

	if (!locals.user) {
		if (!onAuthRoute) redirect(303, '/login');
		return { user: null, entityName: 'Your Entity', wallets: [], hasWallets: false };
	}

	if (onAuthRoute) redirect(303, '/');

	const entity = await db.query.entitySettings.findFirst();
	const wallets = await db.query.wallets.findMany({ with: { address: true } });

	return {
		user: { name: locals.user.name, email: locals.user.email },
		entityName: entity?.name ?? 'Your Entity',
		wallets: wallets.map((w) => ({ id: w.id, name: w.name, bech32: w.address.bech32 })),
		hasWallets: wallets.length > 0
	};
};
