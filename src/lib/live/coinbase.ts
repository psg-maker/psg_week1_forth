import type { CoinbaseTrade, ErrorCode } from "@/lib/shared/types";

export const COINBASE_TRADES_URL =
  "https://api.exchange.coinbase.com/products/BTC-USD/trades";

export class SourceError extends Error {
  constructor(
    public readonly code: Exclude<ErrorCode, "none">,
    message: string,
  ) {
    super(message);
    this.name = "SourceError";
  }
}

function isTrade(value: unknown): value is CoinbaseTrade {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.trade_id === "number" &&
    typeof item.side === "string" &&
    typeof item.size === "string" &&
    typeof item.price === "string" &&
    typeof item.time === "string" &&
    Number.isFinite(Number(item.price)) &&
    Number(item.price) > 0 &&
    !Number.isNaN(new Date(item.time).getTime())
  );
}

export async function fetchLatestCoinbaseTrade(): Promise<CoinbaseTrade> {
  let response: Response;

  try {
    response = await fetch(COINBASE_TRADES_URL, {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": "aleph-t04-bitcoin-board/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new SourceError("timeout", "Coinbase response timed out.");
    }
    throw new SourceError("offline", "Coinbase could not be reached.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new SourceError("auth", `Coinbase rejected the request with ${response.status}.`);
  }

  if (response.status === 429) {
    throw new SourceError("rate_limit", "Coinbase rate limit was reached.");
  }

  if (!response.ok) {
    throw new SourceError("schema_error", `Unexpected Coinbase HTTP status: ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SourceError("schema_error", "Coinbase returned non-JSON data.");
  }

  if (!Array.isArray(body) || body.length === 0) {
    throw new SourceError("schema_error", "Coinbase trade list is empty or malformed.");
  }

  const trades = body.filter(isTrade);
  if (trades.length === 0) {
    throw new SourceError("schema_error", "Coinbase response contains no valid trade.");
  }

  // 응답 순서를 맹신하지 않고 체결 시각 기준 가장 최신 거래를 고른다.
  return trades.sort(
    (left, right) => new Date(right.time).getTime() - new Date(left.time).getTime(),
  )[0];
}
