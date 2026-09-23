import type { NormalizedReading, ReadingStatus } from "@/lib/shared/types";
import { kstDate } from "@/lib/shared/time";

const NORMALIZED_KEYS = [
  "signal_id",
  "normalized_value",
  "unit",
  "source_name",
  "source_url",
  "source_time",
  "fetched_at",
  "record_timezone",
  "record_date",
] as const;

const ERROR_CODES = ["timeout", "auth", "rate_limit", "offline", "schema_error"] as const;

export function validateNormalizedReading(input: unknown): asserts input is NormalizedReading {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("normalized reading must be an object");
  }

  const reading = input as Record<string, unknown>;
  const actualKeys = Object.keys(reading).sort();
  const expectedKeys = [...NORMALIZED_KEYS].sort();

  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new TypeError(`normalized reading keys must be exactly: ${NORMALIZED_KEYS.join(", ")}`);
  }

  if (
    typeof reading.signal_id !== "string" ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(reading.signal_id) ||
    reading.signal_id.length > 100
  ) {
    throw new TypeError("signal_id is invalid");
  }

  if (typeof reading.normalized_value !== "number" || !Number.isFinite(reading.normalized_value)) {
    throw new TypeError("normalized_value must be a finite number");
  }

  if (typeof reading.unit !== "string" || reading.unit.trim() === "" || reading.unit.length > 24) {
    throw new TypeError("unit must be a non-empty string up to 24 characters");
  }

  if (
    typeof reading.source_name !== "string" ||
    reading.source_name.trim() === "" ||
    reading.source_name.length > 120
  ) {
    throw new TypeError("source_name must be a non-empty string up to 120 characters");
  }

  if (typeof reading.source_url !== "string") {
    throw new TypeError("source_url must be a string");
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(reading.source_url);
  } catch {
    throw new TypeError("source_url must be an absolute URL");
  }
  if (sourceUrl.protocol !== "https:") {
    throw new TypeError("source_url must use HTTPS");
  }

  if (
    reading.source_time !== null &&
    (typeof reading.source_time !== "string" || Number.isNaN(new Date(reading.source_time).getTime()))
  ) {
    throw new TypeError("source_time must be a valid date-time or null");
  }

  if (typeof reading.fetched_at !== "string" || Number.isNaN(new Date(reading.fetched_at).getTime())) {
    throw new TypeError("fetched_at must be a valid date-time");
  }

  if (reading.record_timezone !== "Asia/Seoul") {
    throw new TypeError("record_timezone must be Asia/Seoul");
  }

  if (
    typeof reading.record_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(reading.record_date) ||
    reading.record_date !== kstDate(reading.fetched_at)
  ) {
    throw new TypeError("record_date must be the Asia/Seoul date derived from fetched_at");
  }
}

export function validateStatus(status: ReadingStatus): boolean {
  if (status.freshness === "fresh") return status.error_code === "none";
  return ERROR_CODES.includes(status.error_code as (typeof ERROR_CODES)[number]);
}
