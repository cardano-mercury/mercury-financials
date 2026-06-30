import { db } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const entity = await db.query.entitySettings.findFirst();
	const wallets = await db.query.wallets.findMany({ with: { address: true } });

	return {
		entityName: entity?.name ?? 'Your Entity',
		wallets: wallets.map((w) => ({ id: w.id, name: w.name, bech32: w.address.bech32 })),
		hasWallets: wallets.length > 0
	};
};
