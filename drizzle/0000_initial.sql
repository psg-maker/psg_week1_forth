CREATE TABLE IF NOT EXISTS "daily_readings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "signal_id" varchar(100) NOT NULL,
  "record_date" date NOT NULL,
  "normalized_value" double precision NOT NULL,
  "unit" varchar(24) NOT NULL,
  "source_name" varchar(120) NOT NULL,
  "source_url" text NOT NULL,
  "source_time" timestamp with time zone,
  "first_fetched_at" timestamp with time zone NOT NULL,
  "last_fetched_at" timestamp with time zone NOT NULL,
  "reading" jsonb NOT NULL,
  "raw_payload" jsonb NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_readings_signal_date_unique"
ON "daily_readings" ("signal_id", "record_date");

CREATE TABLE IF NOT EXISTS "live_status" (
  "id" integer PRIMARY KEY NOT NULL,
  "freshness" varchar(16) NOT NULL,
  "error_code" varchar(32) NOT NULL,
  "last_attempt_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "live_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" varchar(32) NOT NULL,
  "record_date" date NOT NULL,
  "server_created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "source_url" text NOT NULL,
  "source_observed_at" timestamp with time zone,
  "normalized_value" double precision NOT NULL,
  "unit" varchar(24) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "live_receipts_record_date_unique"
ON "live_receipts" ("record_date");

CREATE TABLE IF NOT EXISTS "replay_states" (
  "id" integer PRIMARY KEY NOT NULL,
  "state" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
