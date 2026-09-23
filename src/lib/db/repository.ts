import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { dailyReadings, liveReceipts, liveStatus, replayStates } from "@/lib/db/schema";
import { comparisonFor } from "@/lib/shared/comparison";
import type {
  CoinbaseTrade,
  ErrorCode,
  NormalizedReading,
  ReplayState,
} from "@/lib/shared/types";
import { initialReplayState } from "@/lib/replay/engine";

const LIVE_STATUS_ID = 1;
const REPLAY_STATE_ID = 1;

export async function saveLiveSuccess(reading: NormalizedReading, rawPayload: CoinbaseTrade) {
  await db
    .insert(dailyReadings)
    .values({
      signalId: reading.signal_id,
      recordDate: reading.record_date,
      normalizedValue: reading.normalized_value,
      unit: reading.unit,
      sourceName: reading.source_name,
      sourceUrl: reading.source_url,
      sourceTime: reading.source_time,
      firstFetchedAt: reading.fetched_at,
      lastFetchedAt: reading.fetched_at,
      reading,
      rawPayload,
    })
    .onConflictDoUpdate({
      target: [dailyReadings.signalId, dailyReadings.recordDate],
      set: {
        normalizedValue: reading.normalized_value,
        unit: reading.unit,
        sourceName: reading.source_name,
        sourceUrl: reading.source_url,
        sourceTime: reading.source_time,
        lastFetchedAt: reading.fetched_at,
        reading,
        rawPayload,
      },
    });

  await db
    .insert(liveStatus)
    .values({
      id: LIVE_STATUS_ID,
      freshness: "fresh",
      errorCode: "none",
      lastAttemptAt: reading.fetched_at,
    })
    .onConflictDoUpdate({
      target: liveStatus.id,
      set: {
        freshness: "fresh",
        errorCode: "none",
        lastAttemptAt: reading.fetched_at,
      },
    });

  // C22용 실제 날짜 증거는 정확히 두 날짜만 보존한다.
  // 같은 날짜에 다시 조회하면 그 날짜의 증거 값은 최신값으로 갱신한다.
  const sameDate = await db
    .select({ id: liveReceipts.id })
    .from(liveReceipts)
    .where(eq(liveReceipts.recordDate, reading.record_date))
    .limit(1);

  if (sameDate.length > 0) {
    await db
      .update(liveReceipts)
      .set({
        sourceUrl: reading.source_url,
        sourceObservedAt: reading.source_time,
        normalizedValue: reading.normalized_value,
        unit: reading.unit,
      })
      .where(eq(liveReceipts.recordDate, reading.record_date));
  } else {
    const receipts = await db.select({ id: liveReceipts.id }).from(liveReceipts).limit(2);
    if (receipts.length < 2) {
      await db.insert(liveReceipts).values({
        kind: "t04_day",
        recordDate: reading.record_date,
        sourceUrl: reading.source_url,
        sourceObservedAt: reading.source_time,
        normalizedValue: reading.normalized_value,
        unit: reading.unit,
      });
    }
  }
}

export async function markLiveFailure(errorCode: Exclude<ErrorCode, "none">) {
  const now = new Date().toISOString();
  await db
    .insert(liveStatus)
    .values({
      id: LIVE_STATUS_ID,
      freshness: "stale",
      errorCode,
      lastAttemptAt: now,
    })
    .onConflictDoUpdate({
      target: liveStatus.id,
      set: {
        freshness: "stale",
        errorCode,
        lastAttemptAt: now,
      },
    });
}

export async function getLiveBoardState() {
  const rows = await db
    .select()
    .from(dailyReadings)
    .where(eq(dailyReadings.signalId, "btc-usd"))
    .orderBy(desc(dailyReadings.recordDate))
    .limit(14);

  const statusRows = await db.select().from(liveStatus).where(eq(liveStatus.id, LIVE_STATUS_ID)).limit(1);
  const receipts = await db
    .select()
    .from(liveReceipts)
    .orderBy(asc(liveReceipts.serverCreatedAt))
    .limit(2);

  const current = rows[0] ?? null;
  const comparison = current
    ? comparisonFor(
        rows.map((row) => ({
          signal_id: row.signalId,
          record_date: row.recordDate,
          normalized_value: row.normalizedValue,
          unit: row.unit,
        })),
        {
          signal_id: current.signalId,
          record_date: current.recordDate,
          normalized_value: current.normalizedValue,
          unit: current.unit,
        },
      )
    : { state: "insufficient" as const, direction: null, magnitude: null, unit: null };

  return {
    current,
    rows,
    status: statusRows[0] ?? null,
    comparison,
    receipts,
  };
}

export async function getReplayState(): Promise<ReplayState> {
  const rows = await db.select().from(replayStates).where(eq(replayStates.id, REPLAY_STATE_ID)).limit(1);
  if (rows[0]) return rows[0].state;

  const initial = initialReplayState();
  await saveReplayState(initial);
  return initial;
}

export async function saveReplayState(state: ReplayState): Promise<void> {
  await db
    .insert(replayStates)
    .values({ id: REPLAY_STATE_ID, state, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: replayStates.id,
      set: { state, updatedAt: new Date().toISOString() },
    });
}

export async function resetReplayState(): Promise<ReplayState> {
  const state = initialReplayState();
  await saveReplayState(state);
  return state;
}
