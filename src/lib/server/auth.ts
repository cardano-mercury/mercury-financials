import { env } from '$env/dynamic/private';
import { createAuth } from '@cardano-mercury/core/auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { authDb } from '$lib/server/db';

/**
 * Better Auth for financials, built from mercury-core's shared factory so it stays in step with the
 * other Mercury apps. The app injects its env and the SvelteKit cookie plugin; set COOKIE_DOMAIN
 * (e.g. .cardano-mercury.com) in production for cross-app SSO.
 */
export const auth = createAuth({
	db: authDb,
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.ORIGIN,
	issuer: 'Mercury Financials',
	cookieDomain: env.COOKIE_DOMAIN || undefined,
	plugins: [sveltekitCookies(getRequestEvent)] // keep last
});
