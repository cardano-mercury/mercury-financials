import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { signupsOpen } from '$lib/server/auth-policy';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, '/');
	return { signupsOpen: await signupsOpen() };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const email = form.get('email')?.toString().trim() ?? '';
		const password = form.get('password')?.toString() ?? '';

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { message: 'Invalid email or password.', email });
			}
			console.error(e);
			return fail(500, { message: 'Something went wrong. Try again.', email });
		}

		redirect(303, '/');
	}
};
