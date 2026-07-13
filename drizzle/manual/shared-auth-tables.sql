-- STOPGAP. Delete this file once mercury-core ships its own migration runner.
--
-- The shared Better Auth tables (user, session, account, verification, two_factor) belong to
-- mercury-core: every Mercury app queries them, and core is the only place their shape is defined
-- once. Core does not yet ship migrations for them (see the TRD filed at
-- mercury-core/.claude/trds/CORE_OWNS_AUTH_MIGRATIONS.md), so until it does, somebody has to create
-- them or a fresh database has no auth at all.
--
-- Financials used to create them in its own migration history, which is exactly the collision this
-- file exists to avoid: tokenomics' tables foreign-key to "user", so whichever app migrated second
-- against a shared database either failed or silently diverged. Financials' migrations now only
-- ever touch financials_* tables.
--
-- Run this ONCE per database, by hand, before either app migrates:
--   psql "$DATABASE_URL" -f drizzle/manual/shared-auth-tables.sql
--
-- It is idempotent, so re-running it is safe. The definitions mirror
-- mercury-core/src/db/schema.ts; if that file changes, core's migrations are the source of truth,
-- not this file.

CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text,
	"backup_codes" text,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "two_factor_user_id_idx" ON "two_factor" USING btree ("user_id");
