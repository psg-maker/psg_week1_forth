import { NextResponse } from "next/server";
import { fetchLatestCoinbaseTrade } from "@/lib/live/coinbase";
import { normalizeCoinbaseTrade } from "@/lib/live/normalize";
import { classifyLiveError } from "@/lib/live/errors";
import {
  getLiveBoardState,
  markLiveFailure,
  saveLiveSuccess,
} from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const rawTrade = await fetchLatestCoinbaseTrade();
    const reading = normalizeCoinbaseTrade(rawTrade);

    await saveLiveSuccess(reading, rawTrade);
    const state = await getLiveBoardState();

    return NextResponse.json(
      {
        ok: true,
        raw: rawTrade,
        normalized: reading,
        state,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorCode = classifyLiveError(error);
    console.error("POST /api/live/fetch failed", errorCode, error);

    try {
      await markLiveFailure(errorCode);
      const state = await getLiveBoardState();
      return NextResponse.json(
        {
          ok: false,
          error_code: errorCode,
          state,
        },
        { status: 503 },
      );
    } catch (dbError) {
      console.error("Failed to persist live error state", dbError);
      return NextResponse.json(
        { ok: false, error_code: errorCode, message: "오류 상태를 저장하지 못했습니다." },
        { status: 500 },
      );
    }
  }
}
