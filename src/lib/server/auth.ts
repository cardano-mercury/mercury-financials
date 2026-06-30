import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { twoFactor } from 'better-auth/plugins';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

/**
 * Better Auth, kept in step with mercury-tokenomics so the apps can share one Postgres database
 * and a single account set. Same config shape, env vars (ORIGIN, BETTER_AUTH_SECRET), and table
 * conventions; the difference is provider 'pg' here vs 'sqlite' there, which is why the shared DB
 * needs both apps on Postgres.
 */
export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	plugins: [
		twoFactor({ issuer: 'Mercury Financials' }),
		sveltekitCookies(getRequestEvent) // keep last
	]
});
