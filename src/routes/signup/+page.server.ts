import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { signupsOpen } from '$lib/server/auth-policy';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, '/');
	// Single-user instance that already has its account: nothing to sign up for.
	if (!(await signupsOpen())) redirect(303, '/login');
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim() ?? '';
		const email = form.get('email')?.toString().trim() ?? '';
		const password = form.get('password')?.toString() ?? '';

		// Re-check at submit time so the close-after-first-account guard can't be raced.
		if (!(await signupsOpen())) redirect(303, '/login');

		if (!name || !email) return fail(400, { message: 'Name and email are required.', name, email });
		if (password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters.', name, email });
		}

		try {
			await auth.api.signUpEmail({ body: { name, email, password } });
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, {
					message: 'Could not create the account. Is the email already used?',
					name,
					email
				});
			}
			console.error(e);
			return fail(500, { message: 'Something went wrong. Try again.', name, email });
		}

		redirect(303, '/');
	}
};
