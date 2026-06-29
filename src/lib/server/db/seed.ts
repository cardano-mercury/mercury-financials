import { sql } from 'drizzle-orm';
import { db } from './index';
import { accounts, entitySettings } from './schema';
import { CHART_OF_ACCOUNTS } from './accounts-data';

/**
 * Idempotently seed the chart of accounts and the single entity settings row. Safe to call on
 * every boot: accounts upsert by their unique path, and the entity row is only created once.
 */
export async function seedReferenceData() {
	await db
		.insert(accounts)
		.values(CHART_OF_ACCOUNTS.map((a, i) => ({ ...a, sortOrder: i })))
		.onConflictDoNothing();

	await db
		.insert(entitySettings)
		.values({ id: 1 })
		.onConflictDoNothing({ target: entitySettings.id });
}

/** True once the accounts table exists and has rows. Used to gate boot seeding. */
export async function referenceDataReady(): Promise<boolean> {
	try {
		const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(accounts);
		return count > 0;
	} catch {
		return false;
	}
}
