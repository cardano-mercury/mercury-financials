import {
	pgTable,
	serial,
	integer,
	bigint,
	text,
	boolean,
	jsonb,
	timestamp,
	uniqueIndex,
	index
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * Single-user "CFO Tool": there is no users table by design.
 *
 * `addresses` is the address book and the home for every bech32 we know about: the wallets we
 * track (is_own), the named counterparties from the address book (name + description), and the
 * bare counterparty addresses discovered while parsing transactions (name/description null until
 * the user labels them).
 */
export const addresses = pgTable('addresses', {
	id: serial('id').primaryKey(),
	bech32: text('bech32').notNull().unique(),
	stakeKey: text('stake_key'),
	name: text('name'),
	description: text('description'),
	isOwn: boolean('is_own').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const wallets = pgTable('wallets', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	addressId: integer('address_id')
		.notNull()
		.references(() => addresses.id, { onDelete: 'cascade' }),
	lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/**
 * Mirrors a Blockfrost transaction detail. Raw Blockfrost payloads (output_amount, utxo_detail,
 * withdrawals) are kept as jsonb so re-parsing never needs another API round trip. Lovelace and
 * other amounts that are summed live in bigint columns; quantities inside the jsonb stay as the
 * strings Blockfrost returns and are parsed to BigInt at use.
 */
export const transactions = pgTable(
	'transactions',
	{
		id: serial('id').primaryKey(),
		walletId: integer('wallet_id')
			.notNull()
			.references(() => wallets.id, { onDelete: 'cascade' }),
		// The contra account this transaction is categorised to (the non-cash leg). Defaulted on
		// ingest, overridable by the user. Null only until first categorised.
		accountId: integer('account_id').references(() => accounts.id),
		hash: text('hash').notNull(),
		block: text('block').notNull(),
		blockHeight: integer('block_height').notNull(),
		blockTime: integer('block_time').notNull(), // unix epoch seconds
		slot: bigint('slot', { mode: 'bigint' }).notNull(),
		index: integer('index').notNull(),
		fees: bigint('fees', { mode: 'bigint' })
			.notNull()
			.default(sql`0`),
		deposit: bigint('deposit', { mode: 'bigint' })
			.notNull()
			.default(sql`0`),
		// Wallet's net lovelace change (the Cash leg) and whether it paid the fee. Derived at ingest.
		netLovelace: bigint('net_lovelace', { mode: 'bigint' })
			.notNull()
			.default(sql`0`),
		walletIsInput: boolean('wallet_is_input').notNull().default(false),
		// Bumped when parsing logic changes so stored rows can be re-derived. See PARSER_VERSION.
		parserVersion: integer('parser_version').notNull().default(0),
		size: integer('size').notNull().default(0),
		invalidBefore: text('invalid_before'),
		invalidHereafter: text('invalid_hereafter'),
		utxoCount: integer('utxo_count').notNull().default(0),
		withdrawalCount: integer('withdrawal_count').notNull().default(0),
		mirCertCount: integer('mir_cert_count').notNull().default(0),
		delegationCount: integer('delegation_count').notNull().default(0),
		stakeCertCount: integer('stake_cert_count').notNull().default(0),
		poolUpdateCount: integer('pool_update_count').notNull().default(0),
		poolRetireCount: integer('pool_retire_count').notNull().default(0),
		assetMintOrBurnCount: integer('asset_mint_or_burn_count').notNull().default(0),
		redeemerCount: integer('redeemer_count').notNull().default(0),
		validContract: boolean('valid_contract').notNull().default(true),
		outputAmount: jsonb('output_amount'),
		withdrawals: jsonb('withdrawals'),
		utxoDetail: jsonb('utxo_detail'),
		parsedAt: timestamp('parsed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('transactions_wallet_hash_idx').on(t.walletId, t.hash),
		index('transactions_wallet_block_height_idx').on(t.walletId, t.blockHeight)
	]
);

/**
 * Derived accounting line items. Each row is one (unit, quantity) flow between a from and to
 * address for a transaction, produced by the eUTxO parser. This is the normalized data the
 * reports build on.
 */
export const outputs = pgTable(
	'outputs',
	{
		id: serial('id').primaryKey(),
		transactionId: integer('transaction_id')
			.notNull()
			.references(() => transactions.id, { onDelete: 'cascade' }),
		hash: text('hash').notNull(),
		index: integer('index').notNull(),
		unit: text('unit').notNull(),
		quantity: bigint('quantity', { mode: 'bigint' }).notNull(),
		fromAddressId: integer('from_address_id').references(() => addresses.id),
		toAddressId: integer('to_address_id').references(() => addresses.id),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('outputs_dedupe_idx').on(
			t.transactionId,
			t.hash,
			t.index,
			t.unit,
			t.fromAddressId,
			t.toAddressId
		)
	]
);

export const transactionTags = pgTable(
	'transaction_tags',
	{
		id: serial('id').primaryKey(),
		transactionId: integer('transaction_id')
			.notNull()
			.references(() => transactions.id, { onDelete: 'cascade' }),
		name: text('name').notNull()
	},
	(t) => [uniqueIndex('transaction_tags_tx_name_idx').on(t.transactionId, t.name)]
);

/**
 * Single instance-wide entity. The local instance is one organisation; this row carries the name
 * that prints on the report headers ("Name of Entity" in the sample statements).
 */
export const entitySettings = pgTable('entity_settings', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().default('Your Entity'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Statement = 'balance_sheet' | 'profit_loss';
export type NormalBalance = 'debit' | 'credit';

/**
 * Chart of accounts, seeded from the finance-docs spreadsheet. Each row is a leaf account a
 * transaction can be categorised to. `section` + `subgroups` reproduce the statement hierarchy for
 * report roll-ups; `path` is the human breadcrumb used in the category dropdown.
 *
 * `isCash` marks the wallet's own Cash and cash equivalents account (the automatic leg of every
 * transaction). `isInternalTransfer` is a synthetic account used to net transfers between our own
 * wallets; it has no statement and is excluded from the reports.
 */
export const accounts = pgTable(
	'accounts',
	{
		id: serial('id').primaryKey(),
		statement: text('statement').$type<Statement | null>(),
		section: text('section'),
		subgroups: jsonb('subgroups').$type<string[]>().notNull().default([]),
		name: text('name').notNull(),
		path: text('path').notNull(),
		normalBalance: text('normal_balance').$type<NormalBalance>().notNull(),
		isCash: boolean('is_cash').notNull().default(false),
		isInternalTransfer: boolean('is_internal_transfer').notNull().default(false),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [uniqueIndex('accounts_path_idx').on(t.path)]
);

export const addressesRelations = relations(addresses, ({ many, one }) => ({
	wallet: one(wallets, { fields: [addresses.id], references: [wallets.addressId] }),
	outgoing: many(outputs, { relationName: 'from' }),
	incoming: many(outputs, { relationName: 'to' })
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
	address: one(addresses, { fields: [wallets.addressId], references: [addresses.id] }),
	transactions: many(transactions)
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
	wallet: one(wallets, { fields: [transactions.walletId], references: [wallets.id] }),
	account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
	outputs: many(outputs),
	tags: many(transactionTags)
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
	transactions: many(transactions)
}));

export const outputsRelations = relations(outputs, ({ one }) => ({
	transaction: one(transactions, {
		fields: [outputs.transactionId],
		references: [transactions.id]
	}),
	fromAddress: one(addresses, {
		fields: [outputs.fromAddressId],
		references: [addresses.id],
		relationName: 'from'
	}),
	toAddress: one(addresses, {
		fields: [outputs.toAddressId],
		references: [addresses.id],
		relationName: 'to'
	})
}));

export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
	transaction: one(transactions, {
		fields: [transactionTags.transactionId],
		references: [transactions.id]
	})
}));

export type Address = typeof addresses.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Output = typeof outputs.$inferSelect;
export type TransactionTag = typeof transactionTags.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type EntitySettings = typeof entitySettings.$inferSelect;

// Better Auth tables (user/session/account/verification/two_factor), shared with mercury-tokenomics.
export * from './auth.schema';
