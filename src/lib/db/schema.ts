import {
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { CoinbaseTrade, NormalizedReading, ReplayState } from "@/lib/shared/types";

export const dailyReadings = pgTable(
  "daily_readings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    signalId: varchar("signal_id", { length: 100 }).notNull(),
    recordDate: date("record_date", { mode: "string" }).notNull(),
    normalizedValue: doublePrecision("normalized_value").notNull(),
    unit: varchar("unit", { length: 24 }).notNull(),
    sourceName: varchar("source_name", { length: 120 }).notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceTime: timestamp("source_time", { withTimezone: true, mode: "string" }),
    firstFetchedAt: timestamp("first_fetched_at", { withTimezone: true, mode: "string" }).notNull(),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true, mode: "string" }).notNull(),
    reading: jsonb("reading").$type<NormalizedReading>().notNull(),
    rawPayload: jsonb("raw_payload").$type<CoinbaseTrade>().notNull(),
  },
  (table) => ({
    signalDateUnique: uniqueIndex("daily_readings_signal_date_unique").on(
      table.signalId,
      table.recordDate,
    ),
  }),
);

export const liveStatus = pgTable("live_status", {
  id: integer("id").primaryKey(),
  freshness: varchar("freshness", { length: 16 }).notNull(),
  errorCode: varchar("error_code", { length: 32 }).notNull(),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const liveReceipts = pgTable(
  "live_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: varchar("kind", { length: 32 }).notNull(),
    recordDate: date("record_date", { mode: "string" }).notNull(),
    serverCreatedAt: timestamp("server_created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceObservedAt: timestamp("source_observed_at", { withTimezone: true, mode: "string" }),
    normalizedValue: doublePrecision("normalized_value").notNull(),
    unit: varchar("unit", { length: 24 }).notNull(),
  },
  (table) => ({
    recordDateUnique: uniqueIndex("live_receipts_record_date_unique").on(table.recordDate),
  }),
);

export const replayStates = pgTable("replay_states", {
  id: integer("id").primaryKey(),
  state: jsonb("state").$type<ReplayState>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});
