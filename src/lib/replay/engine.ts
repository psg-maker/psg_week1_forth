import { comparisonFor } from "@/lib/shared/comparison";
import type {
  ErrorCode,
  NormalizedReading,
  ReplayFixture,
  ReplayState,
} from "@/lib/shared/types";
import { validateNormalizedReading } from "@/lib/shared/validation";

const FAILURE_CODES: Exclude<ErrorCode, "none">[] = [
  "timeout",
  "auth",
  "rate_limit",
  "offline",
  "schema_error",
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function initialReplayState(): ReplayState {
  return {
    schema_version: "aleph-t04-evaluation-state-v1",
    daily_readings: [],
    current_reading: null,
    status: null,
    last_delta: null,
    last_comparison: {
      state: "insufficient",
      direction: null,
      magnitude: null,
      unit: null,
    },
    last_run: null,
    sequence: 0,
  };
}

function recordIdFor(reading: NormalizedReading): string {
  return `demo-${reading.signal_id}-${reading.record_date}`;
}

export function applySuccessfulReading(
  inputState: ReplayState,
  readingInput: unknown,
  runMeta: { fixture_id?: string; virtual_now?: string } = {},
): ReplayState {
  validateNormalizedReading(readingInput);
  const reading = readingInput;
  const state = clone(inputState);

  const existingIndex = state.daily_readings.findIndex(
    (row) => row.signal_id === reading.signal_id && row.record_date === reading.record_date,
  );
  const existing = existingIndex >= 0 ? state.daily_readings[existingIndex] : null;

  const row = {
    record_id: existing ? existing.record_id : recordIdFor(reading),
    signal_id: reading.signal_id,
    record_date: reading.record_date,
    normalized_value: reading.normalized_value,
    unit: reading.unit,
    first_fetched_at: existing ? existing.first_fetched_at : reading.fetched_at,
    last_fetched_at: reading.fetched_at,
    reading: clone(reading),
  };

  if (existingIndex >= 0) state.daily_readings[existingIndex] = row;
  else state.daily_readings.push(row);
  state.daily_readings.sort((left, right) => left.record_date.localeCompare(right.record_date));

  state.current_reading = clone(reading);
  state.status = { freshness: "fresh", error_code: "none" };
  state.last_comparison = comparisonFor(state.daily_readings, row);
  state.last_delta = state.last_comparison.magnitude;
  state.sequence += 1;
  state.last_run = {
    fixture_id: runMeta.fixture_id ?? null,
    virtual_now: runMeta.virtual_now ?? reading.fetched_at,
    outcome: "success",
    error_code: "none",
    retry_after_seconds: null,
  };

  return state;
}

export function applyError(
  inputState: ReplayState,
  errorCode: Exclude<ErrorCode, "none">,
  runMeta: {
    fixture_id?: string;
    virtual_now?: string;
    retry_after_seconds?: number | null;
  } = {},
): ReplayState {
  if (!FAILURE_CODES.includes(errorCode)) {
    throw new TypeError(`unsupported error code: ${errorCode}`);
  }

  const state = clone(inputState);
  state.status = { freshness: "stale", error_code: errorCode };
  state.sequence += 1;
  state.last_run = {
    fixture_id: runMeta.fixture_id ?? null,
    virtual_now: runMeta.virtual_now ?? null,
    outcome: "error",
    error_code: errorCode,
    retry_after_seconds: runMeta.retry_after_seconds ?? null,
  };

  // 실패에서는 current_reading / daily_readings / last_delta를 건드리지 않는다.
  // 그래서 마지막 정상값이 그대로 보존된다.
  return state;
}

export function runFixture(inputState: ReplayState, fixture: ReplayFixture): ReplayState {
  const retryAfterRaw = fixture.transport.headers["retry-after"];
  const retryAfterSeconds = retryAfterRaw ? Number(retryAfterRaw) : null;
  const meta = {
    fixture_id: fixture.fixture_id,
    virtual_now: fixture.virtual_now,
    retry_after_seconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null,
  };

  if (fixture.transport.mode === "timeout") return applyError(inputState, "timeout", meta);
  if (fixture.transport.mode === "offline") return applyError(inputState, "offline", meta);
  if (fixture.transport.status === 401 || fixture.transport.status === 403) {
    return applyError(inputState, "auth", meta);
  }
  if (fixture.transport.status === 429) return applyError(inputState, "rate_limit", meta);

  if (
    typeof fixture.transport.status === "number" &&
    fixture.transport.status >= 200 &&
    fixture.transport.status < 300
  ) {
    try {
      return applySuccessfulReading(inputState, fixture.payload, meta);
    } catch {
      return applyError(inputState, "schema_error", meta);
    }
  }

  return applyError(inputState, "schema_error", meta);
}

export function fixtureMatchesExpected(state: ReplayState, fixture: ReplayFixture) {
  const latestValue = state.current_reading?.normalized_value ?? null;
  return {
    freshness: state.status?.freshness === fixture.expected.freshness,
    error_code: state.status?.error_code === fixture.expected.error_code,
    row_count: state.daily_readings.length === fixture.expected.row_count,
    stored_value: latestValue === fixture.expected.stored_value,
    delta: state.last_delta === fixture.expected.delta,
  };
}
