import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { wallets } from '$lib/server/db/schema';
import { loadTransactionRegister } from '$lib/server/transactions';
import { getChartOfAccounts, setTransactionCategory } from '$lib/server/accounts';
import { enqueueWalletSync } from '$lib/server/ingest/queue';
import { formatAda } from '$lib/money';

function shortHash(hash: string) {
	return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export const load: PageServerLoad = async () => {
	const [register, accounts] = await Promise.all([
		loadTransactionRegister(),
		getChartOfAccounts()
	]);

	return {
		rows: register.map((r) => ({
			id: r.id,
			date: new Date(r.blockTime * 1000).toISOString().slice(0, 10),
			hash: r.hash,
			hashShort: shortHash(r.hash),
			counterparty: r.counterparty || '—',
			sent: r.sent > 0n ? formatAda(r.sent, { decimals: 2 }) : '',
			received: r.received > 0n ? formatAda(r.received, { decimals: 2 }) : '',
			fee: formatAda(r.fees, { decimals: 2 }),
			accountId: r.accountId,
			tags: r.tags
		})),
		accounts: accounts
			.filter((a) => !a.isInternalTransfer)
			.map((a) => ({ id: a.id, path: a.path, name: a.name })),
		internalTransfer: accounts
			.filter((a) => a.isInternalTransfer)
			.map((a) => ({ id: a.id, path: a.path, name: a.name }))
	};
};

export const actions: Actions = {
	categorize: async ({ request }) => {
		const form = await request.formData();
		const transactionId = Number(form.get('transactionId'));
		const accountId = Number(form.get('accountId'));
		if (!transactionId || !accountId)
			return fail(400, { message: 'Missing transaction or account.' });
		await setTransactionCategory(transactionId, accountId);
		return { ok: true };
	},
	sync: async () => {
		const all = await db.select({ id: wallets.id }).from(wallets);
		await Promise.all(all.map((w) => enqueueWalletSync(w.id)));
		return { ok: true, message: `Syncing ${all.length} wallet${all.length === 1 ? '' : 's'}…` };
	}
};
