import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { wallets } from '$lib/server/db/schema';
import { loadTransactionRegister } from '$lib/server/transactions';
import { getChartOfAccounts, setTransactionCategory } from '$lib/server/accounts';
import { enqueueWalletSync } from '$lib/server/ingest/queue';

const EXPLORER: Record<string, string> = {
	mainnet: 'https://cardanoscan.io/transaction/',
	preprod: 'https://preprod.cardanoscan.io/transaction/',
	preview: 'https://preview.cardanoscan.io/transaction/'
};

export const load: PageServerLoad = async () => {
	const [register, accounts] = await Promise.all([loadTransactionRegister(), getChartOfAccounts()]);

	return {
		explorerBase: EXPLORER[env.BLOCKFROST_NETWORK ?? 'mainnet'] ?? EXPLORER.mainnet,
		rows: register.map((r) => ({
			id: r.id,
			blockTime: r.blockTime,
			date: new Date(r.blockTime * 1000).toISOString().slice(0, 10),
			hash: r.hash,
			counterparties: r.counterparties,
			sent: r.sent.toString(),
			received: r.received.toString(),
			fee: r.fees.toString(),
			net: r.netLovelace.toString(),
			accountId: r.accountId,
			tags: r.tags
		})),
		// Grouped for the dropdown: leaf names with the full path as a tooltip.
		accountGroups: groupAccounts(accounts)
	};
};

function groupAccounts(accounts: Awaited<ReturnType<typeof getChartOfAccounts>>) {
	const groups = new Map<string, { id: number; name: string; path: string }[]>();
	for (const a of accounts) {
		const key = a.isInternalTransfer
			? 'Transfers'
			: `${a.statement === 'profit_loss' ? 'Profit & Loss' : 'Balance Sheet'} · ${a.section}`;
		const list = groups.get(key) ?? [];
		list.push({ id: a.id, name: a.name, path: a.path });
		groups.set(key, list);
	}
	return [...groups.entries()].map(([label, options]) => ({ label, options }));
}

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
