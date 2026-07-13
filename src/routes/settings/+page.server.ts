import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { entitySettings } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const entity = await db.query.entitySettings.findFirst();
	return { entityName: entity?.name ?? '' };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('entityName')?.toString().trim() ?? '';

		if (!name) return fail(400, { message: 'Entity name is required.', entityName: name });
		if (name.length > 120) {
			return fail(400, { message: 'Entity name is too long.', entityName: name });
		}

		// The seed guarantees exactly one row (id 1). Update it rather than upserting, so a
		// mis-seeded database surfaces as an error instead of quietly growing a second entity.
		const entity = await db.query.entitySettings.findFirst();
		if (!entity) {
			return fail(500, {
				message: 'No entity row found. Restart the server to re-seed.',
				entityName: name
			});
		}

		await db
			.update(entitySettings)
			.set({ name, updatedAt: new Date() })
			.where(eq(entitySettings.id, entity.id));

		return { ok: true, entityName: name };
	}
};
