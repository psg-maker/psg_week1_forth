import { describe, expect, test } from "vitest";
import { normalizeCoinbaseTrade } from "../src/lib/live/normalize";
import { kstDate } from "../src/lib/shared/time";

const sampleTrade = {
  trade_id: 1095764835,
  side: "buy",
  size: "0.00000002",
  price: "81597.67000000",
  time: "2026-09-21T00:50:18.299172Z",
};

describe("Coinbase normalization", () => {
  test("maps price and trade time into the T04 normalized reading", () => {
    const reading = normalizeCoinbaseTrade(sampleTrade, "2026-09-21T08:20:31.000Z");

    expect(reading).toEqual({
      signal_id: "btc-usd",
      normalized_value: 81597.67,
      unit: "USD/BTC",
      source_name: "Coinbase Exchange",
      source_url: "https://api.exchange.coinbase.com/products/BTC-USD/trades",
      source_time: "2026-09-21T00:50:18.299172Z",
      fetched_at: "2026-09-21T08:20:31.000Z",
      record_timezone: "Asia/Seoul",
      record_date: "2026-09-21",
    });
  });

  test("record_date follows Asia/Seoul, not UTC", () => {
    expect(kstDate("2026-09-21T15:30:00.000Z")).toBe("2026-09-22");
  });
});
