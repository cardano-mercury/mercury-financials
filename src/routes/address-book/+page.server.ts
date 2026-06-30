import { eq } from 'drizzle-orm';
import { asc, desc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { addresses } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const rows = await db.query.addresses.findMany({
		orderBy: [desc(addresses.isOwn), asc(addresses.name)]
	});

	return {
		addresses: rows.map((a) => ({
			id: a.id,
			bech32: a.bech32,
			short:
				a.bech32.length > 18 ? `${a.bech32.slice(0, 10)}…${a.bech32.slice(-6)}` : a.bech32,
			name: a.name ?? '',
			description: a.description ?? '',
			isOwn: a.isOwn
		}))
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const updates = new Map<number, { name: string; description: string }>();

		for (const [key, value] of form.entries()) {
			const match = key.match(/^(name|description)_(\d+)$/);
			if (!match) continue;
			const id = Number(match[2]);
			const entry = updates.get(id) ?? { name: '', description: '' };
			if (match[1] === 'name') entry.name = String(value);
			else entry.description = String(value);
			updates.set(id, entry);
		}

		for (const [id, { name, description }] of updates) {
			await db
				.update(addresses)
				.set({
					name: name.trim() || null,
					description: description.trim() || null,
					updatedAt: new Date()
				})
				.where(eq(addresses.id, id));
		}

		return { ok: true };
	}
};
