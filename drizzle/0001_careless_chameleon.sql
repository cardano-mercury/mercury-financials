CREATE TABLE "accounts" (
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
CREATE TABLE "entity_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Your Entity' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_path_idx" ON "accounts" USING btree ("path");