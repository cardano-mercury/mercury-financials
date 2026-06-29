CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"bech32" text NOT NULL,
	"stake_key" text,
	"name" text,
	"description" text,
	"is_own" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addresses_bech32_unique" UNIQUE("bech32")
);
--> statement-breakpoint
CREATE TABLE "outputs" (
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
CREATE TABLE "transaction_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"hash" text NOT NULL,
	"block" text NOT NULL,
	"block_height" integer NOT NULL,
	"block_time" integer NOT NULL,
	"slot" bigint NOT NULL,
	"index" integer NOT NULL,
	"fees" bigint DEFAULT 0 NOT NULL,
	"deposit" bigint DEFAULT 0 NOT NULL,
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
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address_id" integer NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_from_address_id_addresses_id_fk" FOREIGN KEY ("from_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_to_address_id_addresses_id_fk" FOREIGN KEY ("to_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "outputs_dedupe_idx" ON "outputs" USING btree ("transaction_id","hash","index","unit","from_address_id","to_address_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_tags_tx_name_idx" ON "transaction_tags" USING btree ("transaction_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_wallet_hash_idx" ON "transactions" USING btree ("wallet_id","hash");--> statement-breakpoint
CREATE INDEX "transactions_wallet_block_height_idx" ON "transactions" USING btree ("wallet_id","block_height");