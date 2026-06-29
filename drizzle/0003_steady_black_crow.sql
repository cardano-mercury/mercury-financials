ALTER TABLE "transactions" ADD COLUMN "net_lovelace" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "wallet_is_input" boolean DEFAULT false NOT NULL;