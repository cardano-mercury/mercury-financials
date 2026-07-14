import { env } from '$env/dynamic/private';
import { createAuth } from '@cardano-mercury/core/auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { authDb } from '$lib/server/db';

/**
 * Better Auth for financials, built from mercury-core's shared factory so it stays in step with the
 * other Mercury apps. The app injects its env and the SvelteKit cookie plugin; set COOKIE_DOMAIN
 * (e.g. .cardano-mercury.com) in production for cross-app SSO.
 *
 * Built on first use for the same reason the database client is (see db/index.ts): SvelteKit's
 * postbuild `analyse` step imports every server chunk, and Better Auth throws at construction when
 * BETTER_AUTH_SECRET is unset. Constructing it at module scope would mean `npm run build` could not
 * run without production secrets, which is exactly what you do not want a Docker build to require.
 */
type Auth = ReturnType<typeof createAuth<[ReturnType<typeof sveltekitCookies>]>>;

let instance: Auth | undefined;

function build(): Auth {
	return createAuth({
		db: authDb,
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.ORIGIN,
		issuer: 'Mercury Financials',
		cookieDomain: env.COOKIE_DOMAIN || undefined,
		plugins: [sveltekitCookies(getRequestEvent)] // keep last
	});
}

export const auth = new Proxy({} as Auth, {
	get(_target, prop, receiver) {
		instance ??= build();
		return Reflect.get(instance, prop, receiver);
	}
});
