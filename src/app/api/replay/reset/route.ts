import { NextResponse } from "next/server";
import { resetReplayState } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const state = await resetReplayState();
    return NextResponse.json({ ok: true, state }, { status: 200 });
  } catch (error) {
    console.error("POST /api/replay/reset failed", error);
    return NextResponse.json(
      { ok: false, error: "database_error", message: "합성 상태 초기화에 실패했습니다." },
      { status: 500 },
    );
  }
}
