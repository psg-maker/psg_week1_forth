import { NextResponse } from "next/server";
import { getReplayState } from "@/lib/db/repository";
import { FIXTURE_FILES } from "@/lib/replay/fixtures";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getReplayState();
    return NextResponse.json({ state, fixtures: Object.keys(FIXTURE_FILES) }, { status: 200 });
  } catch (error) {
    console.error("GET /api/replay failed", error);
    return NextResponse.json(
      { error: "database_error", message: "합성 재생 상태를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
