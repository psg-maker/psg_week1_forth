export type Freshness = "fresh" | "stale";
export type ErrorCode =
  | "none"
  | "timeout"
  | "auth"
  | "rate_limit"
  | "offline"
  | "schema_error";

export type NormalizedReading = {
  signal_id: string;
  normalized_value: number;
  unit: string;
  source_name: string;
  source_url: string;
  source_time: string | null;
  fetched_at: string;
  record_timezone: "Asia/Seoul";
  record_date: string;
};

export type ReadingStatus = {
  freshness: Freshness;
  error_code: ErrorCode;
};

export type Comparison = {
  state: "insufficient" | "unit_mismatch" | "comparable";
  direction: "increase" | "decrease" | "unchanged" | null;
  magnitude: number | null;
  unit: string | null;
};

export type ReplayDailyRow = {
  record_id: string;
  signal_id: string;
  record_date: string;
  normalized_value: number;
  unit: string;
  first_fetched_at: string;
  last_fetched_at: string;
  reading: NormalizedReading;
};

export type ReplayState = {
  schema_version: "aleph-t04-evaluation-state-v1";
  daily_readings: ReplayDailyRow[];
  current_reading: NormalizedReading | null;
  status: ReadingStatus | null;
  last_delta: number | null;
  last_comparison: Comparison;
  last_run: {
    fixture_id: string | null;
    virtual_now: string | null;
    outcome: "success" | "error";
    error_code: ErrorCode;
    retry_after_seconds: number | null;
  } | null;
  sequence: number;
};

export type ReplayFixture = {
  fixture_id: string;
  contract_version: "1.1.0";
  description_ko: string;
  virtual_now: string;
  transport: {
    mode: "http" | "timeout" | "offline";
    status: number | null;
    delay_ms: number;
    deadline_ms: number;
    headers: Record<string, string>;
  };
  payload: unknown;
  expected: {
    freshness: Freshness;
    error_code: ErrorCode;
    row_count: number;
    stored_value: number | null;
    delta: number | null;
    preserve_last_good: boolean;
    same_record_id_as?: string;
    record_date?: string;
  };
};

export type CoinbaseTrade = {
  trade_id: number;
  side: "buy" | "sell" | string;
  size: string;
  price: string;
  time: string;
};
