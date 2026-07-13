-- One-off, for a database created BEFORE financials' tables were prefixed.
--
-- Fresh databases do not need this: drizzle/0000_financials_baseline.sql already creates everything
-- with the financials_ prefix. This exists only to carry an existing development database across
-- without losing its data (synced wallets, category overrides, address book labels, entity name).
--
--   psql "$DATABASE_URL" -f drizzle/manual/rename-to-financials-prefix.sql
--
-- Postgres carries indexes, constraints, and foreign keys through a table rename, but it keeps
-- their OLD names. Left alone, `drizzle-kit push` then sees every primary key, unique constraint,
-- and foreign key as missing and offers to recreate them (which, for the unique constraints, means
-- offering to truncate the table). So the constraints get renamed too, to exactly the names
-- drizzle/0000_financials_baseline.sql produces on a fresh database.
--
-- Safe to run twice: every statement is guarded on the old name still existing.

DO $$
BEGIN
	IF to_regclass('public.addresses') IS NOT NULL THEN
		ALTER TABLE "addresses" RENAME TO "financials_address";
	END IF;
	IF to_regclass('public.wallets') IS NOT NULL THEN
		ALTER TABLE "wallets" RENAME TO "financials_wallet";
	END IF;
	IF to_regclass('public.transactions') IS NOT NULL THEN
		ALTER TABLE "transactions" RENAME TO "financials_transaction";
	END IF;
	IF to_regclass('public.outputs') IS NOT NULL THEN
		ALTER TABLE "outputs" RENAME TO "financials_output";
	END IF;
	IF to_regclass('public.transaction_tags') IS NOT NULL THEN
		ALTER TABLE "transaction_tags" RENAME TO "financials_transaction_tag";
	END IF;
	IF to_regclass('public.accounts') IS NOT NULL THEN
		ALTER TABLE "accounts" RENAME TO "financials_account";
	END IF;
	IF to_regclass('public.entity_settings') IS NOT NULL THEN
		ALTER TABLE "entity_settings" RENAME TO "financials_entity_settings";
	END IF;

	IF to_regclass('public.transactions_wallet_hash_idx') IS NOT NULL THEN
		ALTER INDEX "transactions_wallet_hash_idx" RENAME TO "financials_transaction_wallet_hash_idx";
	END IF;
	IF to_regclass('public.transactions_wallet_block_height_idx') IS NOT NULL THEN
		ALTER INDEX "transactions_wallet_block_height_idx" RENAME TO "financials_transaction_wallet_block_height_idx";
	END IF;
	IF to_regclass('public.outputs_dedupe_idx') IS NOT NULL THEN
		ALTER INDEX "outputs_dedupe_idx" RENAME TO "financials_output_dedupe_idx";
	END IF;
	IF to_regclass('public.transaction_tags_tx_name_idx') IS NOT NULL THEN
		ALTER INDEX "transaction_tags_tx_name_idx" RENAME TO "financials_transaction_tag_tx_name_idx";
	END IF;
	IF to_regclass('public.accounts_path_idx') IS NOT NULL THEN
		ALTER INDEX "accounts_path_idx" RENAME TO "financials_account_path_idx";
	END IF;
END
$$;

-- Constraints: primary keys, unique constraints, and foreign keys, renamed to match the baseline
-- migration. `pg_constraint` is keyed on (name, table), so each rename is guarded on the old name
-- still being attached to the renamed table.
DO $$
DECLARE
	r record;
	renames text[][] := ARRAY[
		['financials_account',         'accounts_pkey',                                    'financials_account_pkey'],
		['financials_address',         'addresses_pkey',                                   'financials_address_pkey'],
		['financials_address',         'addresses_bech32_unique',                          'financials_address_bech32_unique'],
		['financials_entity_settings', 'entity_settings_pkey',                             'financials_entity_settings_pkey'],
		['financials_output',          'outputs_pkey',                                     'financials_output_pkey'],
		['financials_output',          'outputs_transaction_id_transactions_id_fk',        'financials_output_transaction_id_financials_transaction_id_fk'],
		['financials_output',          'outputs_from_address_id_addresses_id_fk',          'financials_output_from_address_id_financials_address_id_fk'],
		['financials_output',          'outputs_to_address_id_addresses_id_fk',            'financials_output_to_address_id_financials_address_id_fk'],
		['financials_transaction',     'transactions_pkey',                                'financials_transaction_pkey'],
		['financials_transaction',     'transactions_wallet_id_wallets_id_fk',             'financials_transaction_wallet_id_financials_wallet_id_fk'],
		['financials_transaction',     'transactions_account_id_accounts_id_fk',           'financials_transaction_account_id_financials_account_id_fk'],
		['financials_transaction_tag', 'transaction_tags_pkey',                            'financials_transaction_tag_pkey'],
		-- Short name on purpose: the derived one would exceed Postgres' 63-char identifier limit.
		['financials_transaction_tag', 'transaction_tags_transaction_id_transactions_id_fk','financials_transaction_tag_transaction_id_fk'],
		['financials_wallet',          'wallets_pkey',                                     'financials_wallet_pkey'],
		['financials_wallet',          'wallets_name_unique',                              'financials_wallet_name_unique'],
		['financials_wallet',          'wallets_address_id_addresses_id_fk',               'financials_wallet_address_id_financials_address_id_fk']
	];
	i int;
BEGIN
	FOR i IN 1 .. array_length(renames, 1) LOOP
		SELECT * INTO r
		FROM pg_constraint
		WHERE conname = renames[i][2]
		  AND conrelid = to_regclass('public.' || renames[i][1]);

		IF FOUND THEN
			EXECUTE format(
				'ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
				renames[i][1], renames[i][2], renames[i][3]
			);
		END IF;
	END LOOP;
END
$$;
