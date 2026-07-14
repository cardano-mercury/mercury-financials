import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, transactions } from '$lib/server/db/schema';
import { ACCOUNT_PATHS } from '$lib/server/db/accounts-data';

const pathCache = new Map<string, number>();

/** Resolve a seeded account's id by its breadcrumb path, cached for the process. */
export async function getAccountIdByPath(path: string): Promise<number> {
	const cached = pathCache.get(path);
	if (cached) return cached;
	const row = await db.query.accounts.findFirst({ where: eq(accounts.path, path) });
	if (!row) throw new Error(`Account not found for path: ${path}`);
	pathCache.set(path, row.id);
	return row.id;
}

export interface DefaultCategoryInput {
	/** Net lovelace change for the wallet: positive is an inflow, negative an outflow. */
	netLovelace: bigint;
	hasWithdrawal: boolean;
	counterparties: (string | null)[];
	/** bech32 of every address we own, to detect transfers between our own wallets. */
	ownAddresses: Set<string>;
}

/**
 * Pick a sensible default contra account for a freshly ingested transaction. The user can override
 * it later. Transfers between our own wallets net out (internal transfer); reward withdrawals and
 * other inflows default to Other income; outflows default to Other expenses. Fees are handled
 * separately by the ledger engine, not here.
 */
export function defaultCategoryPath(input: DefaultCategoryInput): string {
	const counterparties = input.counterparties.filter((c): c is string => !!c);
	if (counterparties.length > 0 && counterparties.every((c) => input.ownAddresses.has(c))) {
		return ACCOUNT_PATHS.internalTransfer;
	}
	if (input.hasWithdrawal) return ACCOUNT_PATHS.otherIncome;
	if (input.netLovelace > 0n) return ACCOUNT_PATHS.otherIncome;
	return ACCOUNT_PATHS.otherExpenses;
}

/** Re-categorise a transaction to a different account. */
export async function setTransactionCategory(transactionId: number, accountId: number) {
	await db
		.update(transactions)
		.set({ accountId, updatedAt: new Date() })
		.where(eq(transactions.id, transactionId));
}

/** The full chart of accounts in report order, for the category dropdown. */
export function getChartOfAccounts() {
	return db.query.accounts.findMany({ orderBy: (a, { asc }) => asc(a.sortOrder) });
}
