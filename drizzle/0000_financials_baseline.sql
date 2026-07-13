CREATE TABLE "financials_account" (
	"id" serial PRIMARY KEY NOT NULL,
	"statement" text,
	"section" text,
	"subgroups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"normal_balance" text NOT NULL,
	"is_cash" boolean DEFAULT false NOT NULL,
	"is_internal_transfer" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financials_address" (
	"id" serial PRIMARY KEY NOT NULL,
	"bech32" text NOT NULL,
	"stake_key" text,
	"name" text,
	"description" text,
	"is_own" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financials_address_bech32_unique" UNIQUE("bech32")
);
--> statement-breakpoint
CREATE TABLE "financials_entity_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Your Entity' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financials_output" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"hash" text NOT NULL,
	"index" integer NOT NULL,
	"unit" text NOT NULL,
	"quantity" bigint NOT NULL,
	"from_address_id" integer,
	"to_address_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financials_transaction_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financials_transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"account_id" integer,
	"hash" text NOT NULL,
	"block" text NOT NULL,
	"block_height" integer NOT NULL,
	"block_time" integer NOT NULL,
	"slot" bigint NOT NULL,
	"index" integer NOT NULL,
	"fees" bigint DEFAULT 0 NOT NULL,
	"deposit" bigint DEFAULT 0 NOT NULL,
	"net_lovelace" bigint DEFAULT 0 NOT NULL,
	"wallet_is_input" boolean DEFAULT false NOT NULL,
	"parser_version" integer DEFAULT 0 NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"invalid_before" text,
	"invalid_hereafter" text,
	"utxo_count" integer DEFAULT 0 NOT NULL,
	"withdrawal_count" integer DEFAULT 0 NOT NULL,
	"mir_cert_count" integer DEFAULT 0 NOT NULL,
	"delegation_count" integer DEFAULT 0 NOT NULL,
	"stake_cert_count" integer DEFAULT 0 NOT NULL,
	"pool_update_count" integer DEFAULT 0 NOT NULL,
	"pool_retire_count" integer DEFAULT 0 NOT NULL,
	"asset_mint_or_burn_count" integer DEFAULT 0 NOT NULL,
	"redeemer_count" integer DEFAULT 0 NOT NULL,
	"valid_contract" boolean DEFAULT true NOT NULL,
	"output_amount" jsonb,
	"withdrawals" jsonb,
	"utxo_detail" jsonb,
	"parsed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financials_wallet" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address_id" integer NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financials_wallet_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "financials_output" ADD CONSTRAINT "financials_output_transaction_id_financials_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."financials_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financials_output" ADD CONSTRAINT "financials_output_from_address_id_financials_address_id_fk" FOREIGN KEY ("from_address_id") REFERENCES "public"."financials_address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financials_output" ADD CONSTRAINT "financials_output_to_address_id_financials_address_id_fk" FOREIGN KEY ("to_address_id") REFERENCES "public"."financials_address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financials_transaction_tag" ADD CONSTRAINT "financials_transaction_tag_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."financials_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financials_transaction" ADD CONSTRAINT "financials_transaction_wallet_id_financials_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."financials_wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financials_transaction" ADD CONSTRAINT "financials_transaction_account_id_financials_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financials_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financials_wallet" ADD CONSTRAINT "financials_wallet_address_id_financials_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."financials_address"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "financials_account_path_idx" ON "financials_account" USING btree ("path");--> statement-breakpoint
CREATE UNIQUE INDEX "financials_output_dedupe_idx" ON "financials_output" USING btree ("transaction_id","hash","index","unit","from_address_id","to_address_id");--> statement-breakpoint
CREATE UNIQUE INDEX "financials_transaction_tag_tx_name_idx" ON "financials_transaction_tag" USING btree ("transaction_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "financials_transaction_wallet_hash_idx" ON "financials_transaction" USING btree ("wallet_id","hash");--> statement-breakpoint
CREATE INDEX "financials_transaction_wallet_block_height_idx" ON "financials_transaction" USING btree ("wallet_id","block_height");