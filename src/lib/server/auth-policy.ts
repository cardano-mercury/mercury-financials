import { sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';

/**
 * Mercury Financials ships as a single-user "CFO Tool", so by default it locks itself to one
 * account: the first sign-up wins and /signup closes after that. Set SINGLE_USER_MODE=false to run
 * an open, multi-user instance (e.g. the hosted public version) where anyone can register.
 */
export function singleUserMode(): boolean {
	return (env.SINGLE_USER_MODE ?? 'true').toLowerCase() !== 'false';
}

/**
 * Whether new sign-ups are currently allowed. Always true for an open instance; for a single-user
 * instance, only true until the first account exists.
 */
export async function signupsOpen(): Promise<boolean> {
	if (!singleUserMode()) return true;
	// Raw count against the Better Auth user table. We avoid importing the table object here: it is
	// typed by mercury-core's own (locally linked) copy of drizzle-orm, which TypeScript treats as a
	// different type family from this app's copy.
	const rows = await db.execute(sql`select 1 from "user" limit 1`);
	return rows.length === 0;
}
