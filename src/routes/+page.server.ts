import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createWallet, WalletError } from '$lib/server/wallets';

export const load: PageServerLoad = async ({ parent }) => {
	const { hasWallets } = await parent();
	if (hasWallets) redirect(303, '/transactions');
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const address = String(form.get('address') ?? '');

		try {
			await createWallet({ name, address });
		} catch (e) {
			if (e instanceof WalletError) return fail(400, { message: e.message, name, address });
			console.error(e);
			return fail(500, {
				message: 'Could not add the wallet. Check the address and your Blockfrost key.',
				name,
				address
			});
		}

		redirect(303, '/transactions');
	}
};
