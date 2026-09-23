import { COINBASE_TRADES_URL } from "@/lib/live/coinbase";
import { kstDate, RECORD_TIMEZONE } from "@/lib/shared/time";
import type { CoinbaseTrade, NormalizedReading } from "@/lib/shared/types";
import { validateNormalizedReading } from "@/lib/shared/validation";

export function normalizeCoinbaseTrade(
  trade: CoinbaseTrade,
  fetchedAt = new Date().toISOString(),
): NormalizedReading {
  const reading: NormalizedReading = {
    signal_id: "btc-usd",
    normalized_value: Number(trade.price),
    unit: "USD/BTC",
    source_name: "Coinbase Exchange",
    source_url: COINBASE_TRADES_URL,
    source_time: trade.time,
    fetched_at: fetchedAt,
    record_timezone: RECORD_TIMEZONE,
    record_date: kstDate(fetchedAt),
  };

  validateNormalizedReading(reading);
  return reading;
}
