import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { entitySettings } from '$lib/server/db/schema';
import { demoModeEnabled } from '$lib/server/demo';
import { createWallet } from '$lib/server/wallets';

/**
 * Auto-populate the hosted demo so a reviewer never lands on empty statements. When DEMO_MODE is on
 * and DEMO_SEED_WALLET is set, the first boot on an unseeded instance names the entity
 * (DEMO_SEED_ENTITY_NAME) and adds the wallet, which queues the usual Blockfrost sync. The
 * in-process worker then fills in the transactions and the statements populate themselves.
 *
 * It is a one-shot: as soon as any wallet exists it does nothing, so a re-deploy never re-adds the
 * wallet and an operator who has curated the demo by hand is left alone. Failures are logged, not
 * fatal, so a missing Blockfrost key or a network blip at boot does not take the server down.
 */
export async function seedDemoWallet(): Promise<void> {
	if (!demoModeEnabled()) return;

	const address = (env.DEMO_SEED_WALLET ?? '').trim();
	if (!address) return;

	const existing = await db.query.wallets.findFirst();
	if (existing) return;

	const entityName = (env.DEMO_SEED_ENTITY_NAME ?? '').trim();
	if (entityName) {
		await db
			.update(entitySettings)
			.set({ name: entityName, updatedAt: new Date() })
			.where(eq(entitySettings.id, 1));
	}

	const name = (env.DEMO_SEED_WALLET_NAME ?? 'Demo wallet').trim() || 'Demo wallet';
	await createWallet({ name, address });
	console.log(`[demo-seed] added "${name}" (${address}) and queued its first sync`);
}
